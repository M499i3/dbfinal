import pool from '../config/database.js';

async function checkPendingListings() {
  try {
    console.log('🔍 檢查待審核上架狀態...\n');

    // 1. Check all listings by status
    const statusCount = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM listing
      GROUP BY status
      ORDER BY count DESC
    `);

    console.log('📊 上架狀態統計:');
    statusCount.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count} 筆`);
    });

    // 2. Check pending listings
    const pendingListings = await pool.query(`
      SELECT 
        l.listing_id,
        l.status,
        l.created_at,
        u.name as seller_name,
        u.kyc_level,
        COUNT(li.ticket_id) as ticket_count,
        COUNT(lrf.flag_id) as risk_flag_count
      FROM listing l
      JOIN "user" u ON l.seller_id = u.user_id
      LEFT JOIN listing_item li ON l.listing_id = li.listing_id
      LEFT JOIN listing_risk_flag lrf ON l.listing_id = lrf.listing_id
      WHERE l.status = 'Pending'
      GROUP BY l.listing_id, u.name, u.kyc_level
      ORDER BY l.created_at DESC
    `);

    console.log(`\n⏳ 待審核上架: ${pendingListings.rows.length} 筆`);
    if (pendingListings.rows.length > 0) {
      pendingListings.rows.forEach(listing => {
        console.log(`   - 上架 #${listing.listing_id}: ${listing.ticket_count} 張票券, ${listing.risk_flag_count} 個風險標記`);
        console.log(`     賣家: ${listing.seller_name} (KYC: ${listing.kyc_level})`);
        console.log(`     建立時間: ${listing.created_at}`);
      });
    }

    // 3. Check recent listings that should be pending
    const recentListings = await pool.query(`
      SELECT 
        l.listing_id,
        l.status,
        l.created_at,
        u.name as seller_name,
        u.kyc_level,
        COUNT(li.ticket_id) as ticket_count,
        COUNT(lrf.flag_id) as risk_flag_count
      FROM listing l
      JOIN "user" u ON l.seller_id = u.user_id
      LEFT JOIN listing_item li ON l.listing_id = li.listing_id
      LEFT JOIN listing_risk_flag lrf ON l.listing_id = lrf.listing_id
      WHERE l.created_at > NOW() - INTERVAL '7 days'
      GROUP BY l.listing_id, u.name, u.kyc_level
      ORDER BY l.created_at DESC
      LIMIT 10
    `);

    console.log(`\n📅 最近 7 天建立的上架 (前 10 筆):`);
    recentListings.rows.forEach(listing => {
      const shouldBePending = listing.risk_flag_count > 0;
      const status = listing.status === 'Pending' ? '✅' : (shouldBePending ? '❌ 應該是 Pending' : '✅');
      console.log(`   ${status} 上架 #${listing.listing_id}: ${listing.status}, ${listing.risk_flag_count} 個風險標記`);
    });

    // 4. Check users with low KYC or no listings (should trigger NewSeller flag)
    const newSellers = await pool.query(`
      SELECT 
        u.user_id,
        u.name,
        u.kyc_level,
        COUNT(l.listing_id) as listing_count
      FROM "user" u
      LEFT JOIN listing l ON u.user_id = l.seller_id
      GROUP BY u.user_id, u.name, u.kyc_level
      HAVING COUNT(l.listing_id) = 0 OR u.kyc_level < 2
      ORDER BY u.created_at DESC
      LIMIT 10
    `);

    console.log(`\n👤 新賣家或低 KYC 等級使用者 (前 10 位):`);
    newSellers.rows.forEach(seller => {
      console.log(`   - ${seller.name} (KYC: ${seller.kyc_level}, 上架數: ${seller.listing_count})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ 錯誤:', error);
    process.exit(1);
  }
}

checkPendingListings();

