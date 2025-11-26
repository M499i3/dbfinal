import { Request, Response } from 'express';
import pool from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';

export const getAvailableTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId, zoneId, minPrice, maxPrice } = req.query;

    let query = `
      SELECT t.ticket_id, t.seat_label, t.face_value, t.original_vendor, t.serial_no,
             e.event_id, e.artist, e.title, e.event_date, e.start_time,
             sz.zone_id, sz.name as zone_name,
             li.listing_id, li.price, l.seller_id,
             u.name as seller_name,
             COALESCE(AVG(r.score), 0) as seller_rating,
             COUNT(DISTINCT r.review_id) as review_count
      FROM ticket t
      JOIN event e ON t.event_id = e.event_id
      JOIN seat_zone sz ON t.zone_id = sz.zone_id
      JOIN listing_item li ON t.ticket_id = li.ticket_id AND li.status = 'Active'
      JOIN listing l ON li.listing_id = l.listing_id AND l.status = 'Active'
      JOIN "user" u ON l.seller_id = u.user_id
      LEFT JOIN review r ON r.reviewee_id = l.seller_id
      WHERE e.status = 'Scheduled' AND e.event_date >= CURRENT_DATE
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (eventId) {
      query += ` AND e.event_id = $${paramIndex}`;
      params.push(eventId);
      paramIndex++;
    }

    if (zoneId) {
      query += ` AND sz.zone_id = $${paramIndex}`;
      params.push(zoneId);
      paramIndex++;
    }

    if (minPrice) {
      query += ` AND li.price >= $${paramIndex}`;
      params.push(minPrice);
      paramIndex++;
    }

    if (maxPrice) {
      query += ` AND li.price <= $${paramIndex}`;
      params.push(maxPrice);
      paramIndex++;
    }

    query += `
      GROUP BY t.ticket_id, e.event_id, sz.zone_id, li.listing_id, li.price, l.seller_id, u.name
      ORDER BY li.price ASC
    `;

    const result = await pool.query(query, params);

    res.json({
      tickets: result.rows.map((ticket) => ({
        ticketId: ticket.ticket_id,
        seatLabel: ticket.seat_label,
        faceValue: parseFloat(ticket.face_value),
        originalVendor: ticket.original_vendor,
        serialNo: ticket.serial_no,
        event: {
          eventId: ticket.event_id,
          artist: ticket.artist,
          title: ticket.title,
          eventDate: ticket.event_date,
          startTime: ticket.start_time,
        },
        zone: {
          zoneId: ticket.zone_id,
          name: ticket.zone_name,
        },
        listing: {
          listingId: ticket.listing_id,
          price: parseFloat(ticket.price),
          seller: {
            sellerId: ticket.seller_id,
            name: ticket.seller_name,
            rating: parseFloat(ticket.seller_rating).toFixed(1),
            reviewCount: parseInt(ticket.review_count),
          },
        },
      })),
    });
  } catch (error) {
    console.error('獲取可用票券錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

export const getMyTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  try {
    const result = await pool.query(
      `SELECT t.ticket_id, t.seat_label, t.face_value, t.original_vendor, t.serial_no, t.status,
              e.event_id, e.artist, e.title, e.event_date, e.start_time, e.end_time,
              sz.zone_id, sz.name as zone_name,
              v.name as venue_name, v.city
       FROM ticket t
       JOIN event e ON t.event_id = e.event_id
       JOIN seat_zone sz ON t.zone_id = sz.zone_id
       JOIN venue v ON e.venue_id = v.venue_id
       WHERE t.owner_id = $1
       ORDER BY e.event_date ASC`,
      [userId]
    );

    res.json({
      tickets: result.rows.map((ticket) => ({
        ticketId: ticket.ticket_id,
        seatLabel: ticket.seat_label,
        faceValue: parseFloat(ticket.face_value),
        originalVendor: ticket.original_vendor,
        serialNo: ticket.serial_no,
        status: ticket.status,
        event: {
          eventId: ticket.event_id,
          artist: ticket.artist,
          title: ticket.title,
          eventDate: ticket.event_date,
          startTime: ticket.start_time,
          endTime: ticket.end_time,
        },
        zone: {
          zoneId: ticket.zone_id,
          name: ticket.zone_name,
        },
        venue: {
          name: ticket.venue_name,
          city: ticket.city,
        },
      })),
    });
  } catch (error) {
    console.error('獲取我的票券錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

export const createTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { eventId, zoneId, seatLabel, faceValue, originalVendor, serialNo } = req.body;

  try {
    // 檢查活動是否存在且尚未結束
    const eventCheck = await pool.query(
      `SELECT event_id FROM event WHERE event_id = $1 AND status = 'Scheduled' AND event_date >= CURRENT_DATE`,
      [eventId]
    );

    if (eventCheck.rows.length === 0) {
      res.status(400).json({ error: '活動不存在或已結束' });
      return;
    }

    // 檢查序號是否已存在
    if (serialNo) {
      const serialCheck = await pool.query(
        'SELECT ticket_id FROM ticket WHERE serial_no = $1',
        [serialNo]
      );

      if (serialCheck.rows.length > 0) {
        res.status(400).json({ error: '此票券序號已存在' });
        return;
      }
    }

    const result = await pool.query(
      `INSERT INTO ticket (event_id, zone_id, seat_label, face_value, original_vendor, serial_no, owner_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Valid')
       RETURNING *`,
      [eventId, zoneId, seatLabel, faceValue, originalVendor, serialNo, userId]
    );

    res.status(201).json({
      message: '票券建立成功',
      ticket: result.rows[0],
    });
  } catch (error) {
    console.error('建立票券錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

