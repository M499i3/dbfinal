import pool from '../config/database.js';

/**
 * Fix data inconsistency: Ensure all Pending listings have Pending listing_items
 * and that Pending listings cannot be sold
 */
async function fixPendingListings() {
  try {
    console.log('🔧 開始修復待審核上架的資料一致性...');

    await pool.query('BEGIN');

    // 1. Find all listings with status = 'Pending' but listing_items with status != 'Pending'
    const inconsistentListings = await pool.query(`
      SELECT DISTINCT l.listing_id, l.status as listing_status,
             COUNT(CASE WHEN li.status != 'Pending' THEN 1 END) as inconsistent_items
      FROM listing l
      JOIN listing_item li ON l.listing_id = li.listing_id
      WHERE l.status = 'Pending' AND li.status != 'Pending'
      GROUP BY l.listing_id, l.status
    `);

    console.log(`發現 ${inconsistentListings.rows.length} 筆待審核上架有資料不一致問題`);

    if (inconsistentListings.rows.length > 0) {
      // 2. Fix: Set all listing_items to 'Pending' for Pending listings
      // This is critical: Pending listings should NEVER have Active or Sold items
      const fixedCount = await pool.query(`
        UPDATE listing_item li
        SET status = 'Pending'
        FROM listing l
        WHERE li.listing_id = l.listing_id
        AND l.status = 'Pending'
        AND li.status != 'Pending'
        RETURNING li.listing_id, li.ticket_id
      `);
      console.log(`✅ 已將 ${fixedCount.rows.length} 個 listing_item 的狀態從 Active/Sold 改為 Pending`);
      console.log('   這些項目原本不應該在待審核上架中，已修正');
    }

    // 3. Check for any orders that might have been created from Pending listings (shouldn't happen, but check)
    const invalidOrders = await pool.query(`
      SELECT DISTINCT o.order_id, oi.listing_id, l.status as listing_status
      FROM "order" o
      JOIN order_item oi ON o.order_id = oi.order_id
      JOIN listing l ON oi.listing_id = l.listing_id
      WHERE l.status = 'Pending'
    `);

    if (invalidOrders.rows.length > 0) {
      console.log(`⚠️  警告: 發現 ${invalidOrders.rows.length} 筆訂單來自待審核上架（這不應該發生）`);
      console.log('這些訂單應該被取消或標記為無效');
      // Optionally cancel these orders
      // await pool.query(`
      //   UPDATE "order" SET status = 'Cancelled'
      //   WHERE order_id = ANY($1)
      // `, [invalidOrders.rows.map(r => r.order_id)]);
    }

    await pool.query('COMMIT');

    console.log('\n✅ 待審核上架資料修復完成！');
    console.log('現在所有待審核上架：');
    console.log('  - listing.status = Pending');
    console.log('  - listing_item.status = Pending');
    console.log('  - 不會出現在可購買票券列表中');
    console.log('  - 無法被購買');

    process.exit(0);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ 錯誤:', error);
    process.exit(1);
  }
}

fixPendingListings();

