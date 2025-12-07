import { Request, Response } from 'express';
import pool from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { assessListingRisk, saveRiskFlags } from '../utils/riskAssessment.js';

export const createListing = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { ticketIds, prices, expiresAt } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 驗證價格是否為正整數
    if (!prices || !Array.isArray(prices) || prices.length !== ticketIds.length) {
      res.status(400).json({ error: '價格數量必須與票券數量一致' });
      await client.query('ROLLBACK');
      return;
    }

    for (let i = 0; i < prices.length; i++) {
      const price = parseFloat(prices[i]);
      if (isNaN(price) || price <= 0 || !Number.isInteger(price)) {
        res.status(400).json({ error: '價格必須為正整數' });
        await client.query('ROLLBACK');
        return;
      }
    }

    // 檢查使用者是否擁有這些票券
    const ticketCheck = await client.query(
      `SELECT ticket_id FROM ticket 
       WHERE ticket_id = ANY($1) AND owner_id = $2 AND status = 'Valid'`,
      [ticketIds, userId]
    );

    if (ticketCheck.rows.length !== ticketIds.length) {
      res.status(400).json({ error: '部分票券不屬於您或狀態不正確' });
      await client.query('ROLLBACK');
      return;
    }

    // 檢查票券是否已經上架（包括待審核和已審核通過的）
    const activeListingCheck = await client.query(
      `SELECT li.ticket_id FROM listing_item li
       JOIN listing l ON li.listing_id = l.listing_id
       WHERE li.ticket_id = ANY($1) 
       AND li.status = 'Active' 
       AND l.status = 'Active'
       AND l.approval_status IN ('Pending', 'Approved')`,
      [ticketIds]
    );

    if (activeListingCheck.rows.length > 0) {
      res.status(400).json({ error: '部分票券已經在上架中或等待審核' });
      await client.query('ROLLBACK');
      return;
    }

    // 建立上架記錄（默認為待審核狀態）
    const listingResult = await client.query(
      `INSERT INTO listing (seller_id, expires_at, status, approval_status)
       VALUES ($1, $2, 'Active', 'Pending')
       RETURNING listing_id, created_at`,
      [userId, expiresAt]
    );

    const listingId = listingResult.rows[0].listing_id;

    // Save risk flags if any (within the same transaction)
    if (riskFlags.length > 0) {
      for (const flag of riskFlags) {
        await client.query(
          `INSERT INTO listing_risk_flag (listing_id, flag_type, flag_reason)
           VALUES ($1, $2, $3)`,
          [listingId, flag.type, flag.reason]
        );
      }
    }

    // 建立上架項目
    for (let i = 0; i < ticketIds.length; i++) {
      await client.query(
        `INSERT INTO listing_item (listing_id, ticket_id, price, status)
         VALUES ($1, $2, $3, $4)`,
        [listingId, ticketIds[i], prices[i], initialStatus]
      );
    }

    await client.query('COMMIT');

    const message = requiresReview 
      ? '上架已送出，等待審核中' 
      : '上架成功';

    res.status(201).json({
      message,
      listingId,
      createdAt: listingResult.rows[0].created_at,
      status: listingResult.rows[0].status,
      requiresReview,
      riskFlags: requiresReview ? riskFlags : undefined,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('上架錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  } finally {
    client.release();
  }
};

export const getMyListings = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  try {
    const result = await pool.query(
      `SELECT l.listing_id, l.created_at, l.expires_at, l.status, l.approval_status,
              json_agg(json_build_object(
                'ticketId', t.ticket_id,
                'seatLabel', t.seat_label,
                'price', li.price,
                'status', li.status,
                'eventTitle', e.title,
                'artist', e.artist,
                'eventDate', e.event_date,
                'zoneName', sz.name
              )) as items
       FROM listing l
       JOIN listing_item li ON l.listing_id = li.listing_id
       JOIN ticket t ON li.ticket_id = t.ticket_id
       JOIN event e ON t.event_id = e.event_id
       JOIN seat_zone sz ON t.zone_id = sz.zone_id
       WHERE l.seller_id = $1
       GROUP BY l.listing_id
       ORDER BY l.created_at DESC`,
      [userId]
    );

    res.json({
      listings: result.rows.map((listing) => ({
        listingId: listing.listing_id,
        createdAt: listing.created_at,
        expiresAt: listing.expires_at,
        status: listing.status,
        approvalStatus: listing.approval_status,
        items: listing.items,
      })),
    });
  } catch (error) {
    console.error('獲取我的上架錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

export const cancelListing = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { id } = req.params;

  try {
    // 檢查上架是否屬於當前使用者
    const listingCheck = await pool.query(
      `SELECT listing_id FROM listing WHERE listing_id = $1 AND seller_id = $2 AND status = 'Active'`,
      [id, userId]
    );

    if (listingCheck.rows.length === 0) {
      res.status(404).json({ error: '上架記錄不存在或已取消' });
      return;
    }

    // 檢查是否有票券已經售出
    const soldItemsCheck = await pool.query(
      `SELECT COUNT(*) as sold_count
       FROM listing_item
       WHERE listing_id = $1 AND status = 'Sold'`,
      [id]
    );

    const soldCount = parseInt(soldItemsCheck.rows[0].sold_count);

    if (soldCount > 0) {
      res.status(400).json({ error: '無法取消上架：此上架中已有票券售出' });
      return;
    }

    // 更新上架狀態
    await pool.query(
      `UPDATE listing SET status = 'Cancelled' WHERE listing_id = $1`,
      [id]
    );

    // 只更新未售出的上架項目狀態
    await pool.query(
      `UPDATE listing_item SET status = 'Cancelled' WHERE listing_id = $1 AND status = 'Active'`,
      [id]
    );

    res.json({ message: '已取消上架' });
  } catch (error) {
    console.error('取消上架錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

