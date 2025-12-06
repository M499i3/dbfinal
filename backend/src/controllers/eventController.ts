import { Request, Response } from 'express';
import pool from '../config/database.js';

export const getAllEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { artist, venue, date, status } = req.query;

    let query = `
      SELECT e.event_id, e.artist, e.title, e.event_date, e.start_time, e.end_time, e.status, e.image_url,
             v.venue_id, v.name as venue_name, v.city, v.address,
             COUNT(DISTINCT CASE WHEN li.ticket_id IS NOT NULL AND li.status = 'Active' AND l.status = 'Active' AND l.approval_status = 'Approved' THEN li.ticket_id END) as available_tickets,
             MIN(CASE WHEN li.ticket_id IS NOT NULL AND li.status = 'Active' AND l.status = 'Active' AND l.approval_status = 'Approved' THEN li.price END) as min_price,
             MAX(CASE WHEN li.ticket_id IS NOT NULL AND li.status = 'Active' AND l.status = 'Active' AND l.approval_status = 'Approved' THEN li.price END) as max_price
      FROM event e
      JOIN venue v ON e.venue_id = v.venue_id
      LEFT JOIN ticket t ON e.event_id = t.event_id
      LEFT JOIN listing_item li ON t.ticket_id = li.ticket_id AND li.status = 'Active'
      LEFT JOIN listing l ON li.listing_id = l.listing_id 
        AND l.status = 'Active' 
        AND l.approval_status = 'Approved'
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (artist) {
      query += ` AND e.artist ILIKE $${paramIndex}`;
      params.push(`%${artist}%`);
      paramIndex++;
    }

    if (venue) {
      query += ` AND v.name ILIKE $${paramIndex}`;
      params.push(`%${venue}%`);
      paramIndex++;
    }

    if (date) {
      query += ` AND e.event_date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }

    if (status) {
      query += ` AND e.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
      
      // 如果狀態為 'Scheduled'，額外過濾掉已結束的活動
      if (status === 'Scheduled') {
        query += ` AND (e.event_date + e.start_time) > CURRENT_TIMESTAMP`;
      }
    }

    query += `
      GROUP BY e.event_id, v.venue_id
      ORDER BY e.event_date ASC
    `;

    const result = await pool.query(query, params);

    res.json({
      events: result.rows.map((event) => ({
        eventId: event.event_id,
        artist: event.artist,
        title: event.title,
        eventDate: event.event_date,
        startTime: event.start_time,
        endTime: event.end_time,
        status: event.status,
        imageUrl: event.image_url,
        venue: {
          venueId: event.venue_id,
          name: event.venue_name,
          city: event.city,
          address: event.address,
        },
        availableTickets: parseInt(event.available_tickets) || 0,
        priceRange: {
          min: event.min_price ? parseFloat(event.min_price) : null,
          max: event.max_price ? parseFloat(event.max_price) : null,
        },
      })),
    });
  } catch (error) {
    console.error('獲取活動列表錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

export const getEventById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const eventResult = await pool.query(
      `SELECT e.*, v.name as venue_name, v.city, v.address
       FROM event e
       JOIN venue v ON e.venue_id = v.venue_id
       WHERE e.event_id = $1`,
      [id]
    );

    if (eventResult.rows.length === 0) {
      res.status(404).json({ error: '活動不存在' });
      return;
    }

    const event = eventResult.rows[0];

    // 獲取座位區域資訊（使用統一的 seat_zone）
    const zonesResult = await pool.query(
      `SELECT sz.zone_id, sz.name, sz.row_count, sz.col_count, sz.notes,
              COUNT(DISTINCT li.ticket_id) as available_tickets,
              MIN(li.price) as min_price,
              MAX(li.price) as max_price
       FROM seat_zone sz
       LEFT JOIN ticket t ON sz.zone_id = t.zone_id AND t.event_id = $1
       LEFT JOIN listing_item li ON t.ticket_id = li.ticket_id AND li.status = 'Active'
       LEFT JOIN listing l ON li.listing_id = l.listing_id AND l.status = 'Active'
       WHERE sz.venue_id = $2
       GROUP BY sz.zone_id
       ORDER BY sz.name`,
      [id, event.venue_id]
    );

    res.json({
      eventId: event.event_id,
      artist: event.artist,
      title: event.title,
      eventDate: event.event_date,
      startTime: event.start_time,
      endTime: event.end_time,
      status: event.status,
      imageUrl: event.image_url,
      venue: {
        venueId: event.venue_id,
        name: event.venue_name,
        city: event.city,
        address: event.address,
      },
      seatZones: zonesResult.rows.map((zone) => ({
        zoneId: zone.zone_id,
        name: zone.name,
        rowCount: zone.row_count,
        colCount: zone.col_count,
        notes: zone.notes,
        availableTickets: parseInt(zone.available_tickets) || 0,
        priceRange: {
          min: zone.min_price ? parseFloat(zone.min_price) : null,
          max: zone.max_price ? parseFloat(zone.max_price) : null,
        },
      })),
    });
  } catch (error) {
    console.error('獲取活動詳情錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

