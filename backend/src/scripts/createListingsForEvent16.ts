/**
 * 為 event 16 建立上架票券
 */

import dotenv from 'dotenv';
dotenv.config();

import pool from '../config/database.js';

async function createListingsForEvent16() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        為 Event 16 建立上架票券                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    // 獲取 event 16 的票券
    const ticketsResult = await pool.query(
      `SELECT t.ticket_id, t.face_value, t.zone_id, t.event_id
       FROM ticket t
       WHERE t.event_id = 16
       AND t.owner_id IS NULL
       AND t.status = 'Valid'
       AND NOT EXISTS (
         SELECT 1 FROM listing_item li 
         WHERE li.ticket_id = t.ticket_id 
         AND li.status = 'Active'
       )
       LIMIT 10`
    );

    if (ticketsResult.rows.length === 0) {
      console.log('⚠️  Event 16 沒有需要上架的票券');
      await pool.end();
      process.exit(0);
    }

    console.log(`📋 找到 ${ticketsResult.rows.length} 張需要上架的票券\n`);

    // 獲取或建立測試賣家
    let sellerResult = await pool.query(
      `SELECT user_id FROM "user" WHERE email = 'test@example.com' LIMIT 1`
    );

    let sellerId: number;
    if (sellerResult.rows.length === 0) {
      const newUser = await pool.query(
        `INSERT INTO "user" (name, email, phone, password_hash, kyc_level)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING user_id`,
        ['測試賣家', 'test@example.com', '0912345678', '$2a$10$dummy', 1]
      );
      sellerId = newUser.rows[0].user_id;
      await pool.query(
        `INSERT INTO user_role (user_id, role) VALUES ($1, 'User')`,
        [sellerId]
      );
    } else {
      sellerId = sellerResult.rows[0].user_id;
    }

    // 更新票券的 owner_id
    const ticketIds = ticketsResult.rows.map((t: any) => t.ticket_id);
    await pool.query(
      `UPDATE ticket SET owner_id = $1 WHERE ticket_id = ANY($2)`,
      [sellerId, ticketIds]
    );

    // 建立上架
    const listingResult = await pool.query(
      `INSERT INTO listing (seller_id, expires_at, status)
       VALUES ($1, $2, 'Active')
       RETURNING listing_id`,
      [
        sellerId,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      ]
    );
    
    const listingId = listingResult.rows[0].listing_id;

    // 為每張票券建立上架項目
    for (const ticket of ticketsResult.rows) {
      const discount = 0.7 + Math.random() * 0.25;
      const price = Math.round(parseFloat(ticket.face_value) * discount);
      
      await pool.query(
        `INSERT INTO listing_item (listing_id, ticket_id, price, status)
         VALUES ($1, $2, $3, 'Active')`,
        [listingId, ticket.ticket_id, price]
      );
    }

    console.log(`✅ 成功為 Event 16 建立上架，包含 ${ticketsResult.rows.length} 張票券`);
  } catch (error) {
    console.error('❌ 執行時發生錯誤:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

createListingsForEvent16();

