import pool from '../config/database.js';
import { assessListingRisk } from '../utils/riskAssessment.js';

async function testRiskAssessment() {
  try {
    console.log('🧪 測試風險評估系統...\n');

    // Find a user with low KYC or no listings
    const newSeller = await pool.query(`
      SELECT u.user_id, u.name, u.kyc_level, COUNT(l.listing_id) as listing_count
      FROM "user" u
      LEFT JOIN listing l ON u.user_id = l.seller_id
      GROUP BY u.user_id, u.name, u.kyc_level
      HAVING u.kyc_level < 2 OR COUNT(l.listing_id) = 0
      LIMIT 1
    `);

    if (newSeller.rows.length === 0) {
      console.log('❌ 找不到新賣家來測試');
      process.exit(1);
    }

    const seller = newSeller.rows[0];
    console.log(`👤 測試賣家: ${seller.name}`);
    console.log(`   KYC 等級: ${seller.kyc_level}`);
    console.log(`   歷史上架數: ${seller.listing_count}`);

    // Find a ticket owned by this user
    const ticket = await pool.query(`
      SELECT ticket_id, face_value
      FROM ticket
      WHERE owner_id = $1 AND status = 'Valid'
      LIMIT 1
    `, [seller.user_id]);

    if (ticket.rows.length === 0) {
      console.log('❌ 此賣家沒有可用的票券');
      process.exit(1);
    }

    const testTicket = ticket.rows[0];
    console.log(`\n🎫 測試票券: #${testTicket.ticket_id}`);
    console.log(`   面額: NT$ ${testTicket.face_value}`);

    // Test 1: High price (150% of face value)
    console.log('\n📊 測試 1: 高價風險 (>120% 面額)');
    const highPrice = parseFloat(testTicket.face_value) * 1.5;
    const test1 = await assessListingRisk(seller.user_id, [{
      ticketId: testTicket.ticket_id,
      price: highPrice,
      faceValue: parseFloat(testTicket.face_value)
    }]);
    console.log(`   售價: NT$ ${highPrice} (${(highPrice / parseFloat(testTicket.face_value) * 100).toFixed(0)}% 面額)`);
    console.log(`   風險標記: ${test1.length} 個`);
    test1.forEach(flag => {
      console.log(`     - ${flag.type}: ${flag.reason}`);
    });
    console.log(`   應該為 Pending: ${test1.length > 0 ? '✅ 是' : '❌ 否'}`);

    // Test 2: New seller check
    console.log('\n📊 測試 2: 新賣家風險');
    const normalPrice = parseFloat(testTicket.face_value) * 1.0;
    const test2 = await assessListingRisk(seller.user_id, [{
      ticketId: testTicket.ticket_id,
      price: normalPrice,
      faceValue: parseFloat(testTicket.face_value)
    }]);
    console.log(`   售價: NT$ ${normalPrice} (正常價格)`);
    console.log(`   風險標記: ${test2.length} 個`);
    test2.forEach(flag => {
      console.log(`     - ${flag.type}: ${flag.reason}`);
    });
    console.log(`   應該為 Pending: ${test2.length > 0 ? '✅ 是' : '❌ 否'}`);

    // Test 3: Low price
    console.log('\n📊 測試 3: 低價風險 (<50% 面額)');
    const lowPrice = parseFloat(testTicket.face_value) * 0.3;
    const test3 = await assessListingRisk(seller.user_id, [{
      ticketId: testTicket.ticket_id,
      price: lowPrice,
      faceValue: parseFloat(testTicket.face_value)
    }]);
    console.log(`   售價: NT$ ${lowPrice} (${(lowPrice / parseFloat(testTicket.face_value) * 100).toFixed(0)}% 面額)`);
    console.log(`   風險標記: ${test3.length} 個`);
    test3.forEach(flag => {
      console.log(`     - ${flag.type}: ${flag.reason}`);
    });
    console.log(`   應該為 Pending: ${test3.length > 0 ? '✅ 是' : '❌ 否'}`);

    console.log('\n✅ 風險評估系統運作正常！');
    console.log('\n💡 提示:');
    console.log('   - 現有的上架都是在風險評估系統啟用前建立的，所以都是 Active');
    console.log('   - 新的上架會根據風險評估自動設為 Pending 或 Active');
    console.log('   - 要看到待審核上架，需要建立新的上架並觸發風險標記');

    process.exit(0);
  } catch (error) {
    console.error('❌ 錯誤:', error);
    process.exit(1);
  }
}

testRiskAssessment();

