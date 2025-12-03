import { Response } from 'express';
import pool from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';

// ==================== 場館管理 ====================

export const createVenue = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, city, address } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO venue (name, city, address)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, city, address]
    );

    res.status(201).json({
      message: '場館建立成功',
      venue: result.rows[0],
    });
  } catch (error) {
    console.error('建立場館錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

export const getMyVenues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM venue ORDER BY name');

    res.json({ venues: result.rows });
  } catch (error) {
    console.error('獲取場館列表錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

export const getVenueById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM venue WHERE venue_id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: '場館不存在' });
      return;
    }

    res.json({ venue: result.rows[0] });
  } catch (error) {
    console.error('獲取場館錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

export const updateVenue = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, city, address } = req.body;

  try {
    const result = await pool.query(
      `UPDATE venue SET name = $1, city = $2, address = $3
       WHERE venue_id = $4
       RETURNING *`,
      [name, city, address, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: '場館不存在' });
      return;
    }

    res.json({
      message: '場館更新成功',
      venue: result.rows[0],
    });
  } catch (error) {
    console.error('更新場館錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// ==================== 活動管理 ====================

export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  const { venueId, artist, title, eventDate, startTime, endTime, status } = req.body;

  try {
    // 檢查場館是否存在
    const venueCheck = await pool.query('SELECT venue_id FROM venue WHERE venue_id = $1', [
      venueId,
    ]);

    if (venueCheck.rows.length === 0) {
      res.status(400).json({ error: '場館不存在' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO event (venue_id, artist, title, event_date, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [venueId, artist, title, eventDate, startTime, endTime, status || 'Scheduled']
    );

    res.status(201).json({
      message: '活動建立成功',
      event: result.rows[0],
    });
  } catch (error) {
    console.error('建立活動錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

export const getMyEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT e.*, v.name as venue_name, v.city, v.address
       FROM event e
       JOIN venue v ON e.venue_id = v.venue_id
       ORDER BY e.event_date DESC`
    );

    res.json({ events: result.rows });
  } catch (error) {
    console.error('獲取活動列表錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

export const getEventByIdForBusiness = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT e.*, v.name as venue_name, v.city, v.address
       FROM event e
       JOIN venue v ON e.venue_id = v.venue_id
       WHERE e.event_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: '活動不存在' });
      return;
    }

    res.json({ event: result.rows[0] });
  } catch (error) {
    console.error('獲取活動錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { venueId, artist, title, eventDate, startTime, endTime, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE event 
       SET venue_id = $1, artist = $2, title = $3, event_date = $4, 
           start_time = $5, end_time = $6, status = $7
       WHERE event_id = $8
       RETURNING *`,
      [venueId, artist, title, eventDate, startTime, endTime, status, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: '活動不存在' });
      return;
    }

    res.json({
      message: '活動更新成功',
      event: result.rows[0],
    });
  } catch (error) {
    console.error('更新活動錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// ==================== 座位區域管理 ====================

export const createSeatZone = async (req: AuthRequest, res: Response): Promise<void> => {
  const { venueId, name, rowCount, colCount, notes } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO seat_zone (venue_id, name, row_count, col_count, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [venueId, name, rowCount, colCount, notes]
    );

    res.status(201).json({
      message: '座位區域建立成功',
      seatZone: result.rows[0],
    });
  } catch (error) {
    console.error('建立座位區域錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

export const getSeatZonesByVenue = async (req: AuthRequest, res: Response): Promise<void> => {
  const { venueId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM seat_zone WHERE venue_id = $1 ORDER BY name',
      [venueId]
    );

    res.json({ seatZones: result.rows });
  } catch (error) {
    console.error('獲取座位區域錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// ==================== 票券管理（業務經營者） ====================

export const getAllTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (t.ticket_id)
        t.ticket_id,
        t.event_id,
        e.title as event_title,
        e.artist,
        e.event_date,
        t.zone_id,
        sz.name as zone_name,
        t.seat_label,
        t.face_value,
        t.original_vendor,
        t.serial_no,
        t.status as ticket_status,
        t.owner_id,
        u.name as owner_name,
        u.email as owner_email,
        li.status as listing_status,
        li.price as listing_price,
        o.status as order_status
      FROM ticket t
      LEFT JOIN event e ON t.event_id = e.event_id
      LEFT JOIN seat_zone sz ON t.zone_id = sz.zone_id
      LEFT JOIN "user" u ON t.owner_id = u.user_id
      LEFT JOIN listing_item li ON t.ticket_id = li.ticket_id
      LEFT JOIN listing l ON li.listing_id = l.listing_id
      LEFT JOIN order_item oi ON li.listing_id = oi.listing_id AND li.ticket_id = oi.ticket_id
      LEFT JOIN "order" o ON oi.order_id = o.order_id
      ORDER BY t.ticket_id DESC, li.listing_id DESC`
    );

    res.json({ tickets: result.rows });
  } catch (error) {
    console.error('獲取票券列表錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

export const createTicketForBusiness = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { eventId, zoneId, seatLabel, faceValue, originalVendor, serialNo } = req.body;

  try {
    // 檢查活動是否存在
    const eventCheck = await pool.query(
      'SELECT event_id FROM event WHERE event_id = $1',
      [eventId]
    );

    if (eventCheck.rows.length === 0) {
      res.status(400).json({ error: '活動不存在' });
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
      `INSERT INTO ticket (event_id, zone_id, seat_label, face_value, original_vendor, serial_no, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Valid')
       RETURNING *`,
      [eventId, zoneId, seatLabel, faceValue, originalVendor, serialNo]
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

export const getBusinessStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      eventsResult,
      venuesResult,
      ticketsResult,
      transactionVolumeResult,
      activeListingsResult,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM event'),
      pool.query('SELECT COUNT(*) as count FROM venue'),
      pool.query('SELECT COUNT(*) as count FROM ticket'),
      // Transaction volume - total value of successful transactions (not platform revenue)
      pool.query(
        `SELECT COALESCE(SUM(p.amount), 0) as total
         FROM payment p
         WHERE p.status = 'Success' AND p.method != 'Refund'`
      ),
      // Active listings count
      pool.query(`SELECT COUNT(*) as count FROM listing WHERE status = 'Active'`),
    ]);

    res.json({
      totalEvents: parseInt(eventsResult.rows[0].count),
      totalVenues: parseInt(venuesResult.rows[0].count),
      totalTickets: parseInt(ticketsResult.rows[0].count),
      transactionVolume: parseFloat(transactionVolumeResult.rows[0].total || '0'),
      activeListings: parseInt(activeListingsResult.rows[0].count),
    });
  } catch (error) {
    console.error('獲取統計資料錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

