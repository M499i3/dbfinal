import { Request, Response } from 'express';
import pool from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';

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

    // 檢查票券是否已經上架
    const activeListingCheck = await client.query(
      `SELECT li.ticket_id FROM listing_item li
       JOIN listing l ON li.listing_id = l.listing_id
       WHERE li.ticket_id = ANY($1) AND li.status = 'Active' AND l.status = 'Active'`,
      [ticketIds]
    );

    if (activeListingCheck.rows.length > 0) {
      res.status(400).json({ error: '部分票券已經在上架中' });
      await client.query('ROLLBACK');
      return;
    }

    // 建立上架記錄
    const listingResult = await client.query(
      `INSERT INTO listing (seller_id, expires_at, status)
       VALUES ($1, $2, 'Active')
       RETURNING listing_id, created_at`,
      [userId, expiresAt]
    );

    const listingId = listingResult.rows[0].listing_id;

    // 建立上架項目
    for (let i = 0; i < ticketIds.length; i++) {
      await client.query(
        `INSERT INTO listing_item (listing_id, ticket_id, price, status)
         VALUES ($1, $2, $3, 'Active')`,
        [listingId, ticketIds[i], prices[i]]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: '上架成功',
      listingId,
      createdAt: listingResult.rows[0].created_at,
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

