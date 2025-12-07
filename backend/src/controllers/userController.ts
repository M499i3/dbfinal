import { Request, Response } from 'express';
import pool from '../config/database.js';

/**
 * 獲取賣家資料和所有上架的票券
 */
export const getSellerProfile = async (req: Request, res: Response): Promise<void> => {
  const { sellerId } = req.params;

  try {
    // 獲取賣家基本資料
    const userResult = await pool.query(
      `SELECT u.user_id, u.name, u.email, u.kyc_level, u.created_at,
              COALESCE(AVG(r.score), 0) as rating,
              COUNT(DISTINCT r.review_id) as review_count
       FROM "user" u
       LEFT JOIN review r ON r.reviewee_id = u.user_id
       WHERE u.user_id = $1
       GROUP BY u.user_id`,
      [sellerId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: '賣家不存在' });
      return;
    }

    const seller = userResult.rows[0];

    // 獲取賣家所有上架的票券（排除已過期的活動）
    const listingsResult = await pool.query(
      `SELECT t.ticket_id, t.seat_label, t.face_value, t.original_vendor, t.serial_no,
              e.event_id, e.artist, e.title, e.event_date, e.start_time, e.image_url,
              sz.zone_id, sz.name as zone_name,
              li.listing_id, li.price, li.status as listing_item_status,
              l.created_at as listing_created_at, l.status as listing_status
       FROM listing l
       JOIN listing_item li ON l.listing_id = li.listing_id
       JOIN ticket t ON li.ticket_id = t.ticket_id
       JOIN event e ON t.event_id = e.event_id
       JOIN seat_zone sz ON t.zone_id = sz.zone_id
       WHERE l.seller_id = $1
       AND l.status = 'Active'
       AND l.approval_status = 'Approved'
       AND li.status = 'Active'
       AND e.status = 'Scheduled'
       AND (e.event_date + e.start_time) > CURRENT_TIMESTAMP
       ORDER BY l.created_at DESC`,
      [sellerId]
    );

    res.json({
      seller: {
        sellerId: seller.user_id,
        name: seller.name,
        email: seller.email,
        kycLevel: seller.kyc_level,
        createdAt: seller.created_at,
        rating: parseFloat(seller.rating).toFixed(1),
        reviewCount: parseInt(seller.review_count),
      },
      listings: listingsResult.rows.map((item) => ({
        ticketId: item.ticket_id,
        seatLabel: item.seat_label,
        faceValue: parseFloat(item.face_value),
        originalVendor: item.original_vendor,
        serialNo: item.serial_no,
        event: {
          eventId: item.event_id,
          artist: item.artist,
          title: item.title,
          eventDate: item.event_date,
          startTime: item.start_time,
          imageUrl: item.image_url,
        },
        zone: {
          zoneId: item.zone_id,
          name: item.zone_name,
        },
        listing: {
          listingId: item.listing_id,
          price: parseFloat(item.price),
          createdAt: item.listing_created_at,
          status: item.listing_status,
        },
      })),
    });
  } catch (error) {
    console.error('獲取賣家資料錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

