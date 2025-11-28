/**
 * 更新票券面額為真實的票券價格
 */

import dotenv from 'dotenv';
dotenv.config();

import pool from '../config/database.js';

// 真實的票券價格
const REAL_TICKET_PRICES = [6980, 5980, 4980, 3980, 2980, 7880, 8980, 5880, 4880, 3880, 2880];

async function updateTicketPrices() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        更新票券面額為真實價格                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    // 獲取所有票券
    const ticketsResult = await pool.query(
      `SELECT ticket_id, face_value FROM ticket ORDER BY ticket_id`
    );

    console.log(`📋 找到 ${ticketsResult.rows.length} 張票券\n`);

    let updated = 0;
    for (const ticket of ticketsResult.rows) {
      // 隨機選擇一個真實價格
      const newPrice = REAL_TICKET_PRICES[Math.floor(Math.random() * REAL_TICKET_PRICES.length)];
      
      await pool.query(
        `UPDATE ticket SET face_value = $1 WHERE ticket_id = $2`,
        [newPrice, ticket.ticket_id]
      );
      
      updated++;
    }

    // 更新所有上架項目的價格，確保售價低於面額
    const listingsResult = await pool.query(
      `SELECT li.listing_id, li.ticket_id, li.price, t.face_value
       FROM listing_item li
       JOIN ticket t ON li.ticket_id = t.ticket_id
       WHERE li.status = 'Active'`
    );

    console.log(`📋 找到 ${listingsResult.rows.length} 個上架項目\n`);

    let listingUpdated = 0;
    for (const listing of listingsResult.rows) {
      const faceValue = parseFloat(listing.face_value);
      // 售價設定為面額的 0.7-0.95 倍
      const discount = 0.7 + Math.random() * 0.25;
      const newPrice = Math.round(faceValue * discount);
      
      // 確保售價低於面額
      if (newPrice < faceValue) {
        await pool.query(
          `UPDATE listing_item SET price = $1 WHERE listing_id = $2 AND ticket_id = $3`,
          [newPrice, listing.listing_id, listing.ticket_id]
        );
        listingUpdated++;
      }
    }

    console.log(`✅ 更新完成:`);
    console.log(`   - ${updated} 張票券的面額已更新`);
    console.log(`   - ${listingUpdated} 個上架項目的價格已更新（確保低於面額）`);
  } catch (error) {
    console.error('❌ 更新時發生錯誤:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

updateTicketPrices();

