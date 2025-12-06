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

    // 檢查票券是否已經上架（包括待審核和進行中的）
    const activeListingCheck = await client.query(
      `SELECT li.ticket_id FROM listing_item li
       JOIN listing l ON li.listing_id = l.listing_id
       WHERE li.ticket_id = ANY($1) AND (l.status = 'Active' OR l.status = 'Pending')`,
      [ticketIds]
    );

    if (activeListingCheck.rows.length > 0) {
      res.status(400).json({ error: '部分票券已經在上架中或等待審核' });
      await client.query('ROLLBACK');
      return;
    }

    // Get ticket details with face values for risk assessment
    const ticketDetails = await client.query(
      `SELECT ticket_id, face_value FROM ticket WHERE ticket_id = ANY($1)`,
      [ticketIds]
    );

    const ticketsForAssessment = ticketDetails.rows.map((ticket, index) => ({
      ticketId: ticket.ticket_id,
      price: parseFloat(prices[index]),
      faceValue: parseFloat(ticket.face_value),
    }));

    // Perform risk assessment
    const riskFlags = await assessListingRisk(userId!, ticketsForAssessment);
    const requiresReview = riskFlags.length > 0; // If any risk flags, needs review
    const initialStatus = requiresReview ? 'Pending' : 'Active';
    
    // Debug logging
    console.log(`[Listing Creation] User ${userId}, Risk flags: ${riskFlags.length}, Status: ${initialStatus}`);
    if (riskFlags.length > 0) {
      console.log(`[Listing Creation] Risk flags:`, riskFlags.map(f => f.type));
    }

    // 建立上架記錄
    const listingResult = await client.query(
      `INSERT INTO listing (seller_id, expires_at, status)
       VALUES ($1, $2, $3)
       RETURNING listing_id, created_at, status`,
      [userId, expiresAt, initialStatus]
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
      `SELECT l.listing_id, l.created_at, l.expires_at, l.status,
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

    // 更新上架狀態
    await pool.query(
      `UPDATE listing SET status = 'Cancelled' WHERE listing_id = $1`,
      [id]
    );

    await pool.query(
      `UPDATE listing_item SET status = 'Cancelled' WHERE listing_id = $1`,
      [id]
    );

    res.json({ message: '已取消上架' });
  } catch (error) {
    console.error('取消上架錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

