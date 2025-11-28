/**
 * 為範例票券建立上架
 * 這樣瀏覽票券頁面就能看到可購買的票券了
 */

import dotenv from 'dotenv';
dotenv.config();

import pool from '../config/database.js';

async function createSampleListings() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        為範例票券建立上架                              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    // 獲取所有沒有 owner_id 的票券（系統建立的範例票券）
    const ticketsResult = await pool.query(
      `SELECT t.ticket_id, t.face_value, t.event_id, e.title as event_title
       FROM ticket t
       JOIN event e ON t.event_id = e.event_id
       WHERE t.owner_id IS NULL
       AND t.status = 'Valid'
       AND NOT EXISTS (
         SELECT 1 FROM listing_item li 
         WHERE li.ticket_id = t.ticket_id 
         AND li.status = 'Active'
       )
       ORDER BY RANDOM()
       LIMIT 50`
    );

    if (ticketsResult.rows.length === 0) {
      console.log('⚠️  沒有找到需要上架的票券');
      await pool.end();
      process.exit(0);
    }

    console.log(`📋 找到 ${ticketsResult.rows.length} 張需要上架的票券\n`);

    // 獲取或建立一個測試用戶作為賣家
    let sellerResult = await pool.query(
      `SELECT user_id FROM "user" WHERE email = 'test@example.com' LIMIT 1`
    );

    let sellerId: number;
    if (sellerResult.rows.length === 0) {
      // 建立測試用戶
      const newUser = await pool.query(
        `INSERT INTO "user" (name, email, phone, password_hash, kyc_level)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING user_id`,
        ['測試賣家', 'test@example.com', '0912345678', '$2a$10$dummy', 1]
      );
      sellerId = newUser.rows[0].user_id;
      
      // 設定用戶角色
      await pool.query(
        `INSERT INTO user_role (user_id, role) VALUES ($1, 'User')`,
        [sellerId]
      );
      
      console.log(`✅ 建立測試賣家用戶 (ID: ${sellerId})`);
    } else {
      sellerId = sellerResult.rows[0].user_id;
      console.log(`✅ 使用現有測試賣家用戶 (ID: ${sellerId})`);
    }

    // 更新票券的 owner_id
    const ticketIds = ticketsResult.rows.map((t: any) => t.ticket_id);
    await pool.query(
      `UPDATE ticket SET owner_id = $1 WHERE ticket_id = ANY($2)`,
      [sellerId, ticketIds]
    );
    console.log(`✅ 更新 ${ticketIds.length} 張票券的擁有者\n`);

    // 為票券建立上架
    let created = 0;
    const tickets = ticketsResult.rows;

    for (let i = 0; i < tickets.length; i += 5) {
      // 每 5 張票券建立一個上架
      const batch = tickets.slice(i, i + 5);
      
      await pool.query('BEGIN');
      
      try {
        // 建立上架
        const listingResult = await pool.query(
          `INSERT INTO listing (seller_id, expires_at, status)
           VALUES ($1, $2, 'Active')
           RETURNING listing_id`,
          [
            sellerId,
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天後過期
          ]
        );
        
        const listingId = listingResult.rows[0].listing_id;
        
        // 為每張票券建立上架項目
        for (const ticket of batch) {
          // 售價設定為面額的 0.7-0.95 倍（二手票券通常會打折）
          const discount = 0.7 + Math.random() * 0.25; // 70%-95% 的價格
          const price = parseFloat(ticket.face_value) * discount;
          
          await pool.query(
            `INSERT INTO listing_item (listing_id, ticket_id, price, status)
             VALUES ($1, $2, $3, 'Active')`,
            [listingId, ticket.ticket_id, Math.round(price)]
          );
        }
        
        await pool.query('COMMIT');
        created++;
        console.log(`  ✅ 建立上架 #${listingId} (${batch.length} 張票券)`);
      } catch (error: any) {
        await pool.query('ROLLBACK');
        console.error(`  ❌ 建立上架失敗:`, error.message);
      }
    }

    console.log(`\n📊 完成: 建立了 ${created} 個上架，包含 ${tickets.length} 張票券`);
    console.log(`\n💡 現在瀏覽票券頁面應該可以看到這些票券了！`);
  } catch (error) {
    console.error('❌ 執行時發生錯誤:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

createSampleListings();

