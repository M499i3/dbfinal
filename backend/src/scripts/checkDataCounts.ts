import pool from '../config/database';

async function checkDataCounts() {
  try {
    console.log('📊 檢查資料庫資料量...\n');

    const queries = [
      { name: 'Events (活動)', table: 'event' },
      { name: 'Venues (場館)', table: 'venue' },
      { name: 'Seat Zones (座位區域)', table: 'seat_zone' },
      { name: 'Tickets (票券)', table: 'ticket' },
      { name: 'Users (用戶)', table: '"user"' },
      { name: 'Listings (上架)', table: 'listing' },
      { name: 'Listing Items (上架項目)', table: 'listing_item' },
      { name: 'Orders (訂單)', table: '"order"' },
      { name: 'Order Items (訂單項目)', table: 'order_item' },
      { name: 'Payments (付款)', table: 'payment' },
      { name: 'Transfers (轉移)', table: 'transfer' },
      { name: 'Reviews (評價)', table: 'review' },
      { name: 'Cases (申訴)', table: '"case"' },
      { name: 'Risk Events (風險事件)', table: 'risk_event' },
      { name: 'Blacklist (黑名單)', table: 'blacklist' },
    ];

    for (const q of queries) {
      const result = await pool.query(`SELECT COUNT(*) FROM ${q.table}`);
      const count = parseInt(result.rows[0].count);
      console.log(`${q.name.padEnd(30)} ${count.toLocaleString().padStart(10)} 筆`);
    }

    console.log('\n' + '='.repeat(50));
    
    // Check if any table has 10,000+ rows
    const largeTable = await pool.query(`
      SELECT COUNT(*) FROM ticket
    `);
    const ticketCount = parseInt(largeTable.rows[0].count);
    
    if (ticketCount >= 10000) {
      console.log('✅ 已達成 10,000 筆資料要求（TICKET 表）');
    } else {
      console.log(`⚠️  尚未達成 10,000 筆要求（目前 TICKET 表有 ${ticketCount} 筆）`);
      console.log(`   需要再增加 ${(10000 - ticketCount).toLocaleString()} 筆票券資料`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 錯誤:', error);
    process.exit(1);
  }
}

checkDataCounts();

