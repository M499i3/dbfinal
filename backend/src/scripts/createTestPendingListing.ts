import pool from '../config/database.js';
import { assessListingRisk, saveRiskFlags } from '../utils/riskAssessment.js';

/**
 * Create a test listing that will be in Pending status
 * This helps verify the approval flow works
 */
async function createTestPendingListing() {
  try {
    console.log('🧪 建立測試待審核上架...\n');

    // Find a user with low KYC
    const newSeller = await pool.query(`
      SELECT u.user_id, u.name, u.kyc_level, COUNT(l.listing_id) as listing_count
      FROM "user" u
      LEFT JOIN listing l ON u.user_id = l.seller_id
      GROUP BY u.user_id, u.name, u.kyc_level
      HAVING u.kyc_level < 2
      LIMIT 1
    `);

    if (newSeller.rows.length === 0) {
      console.log('❌ 找不到 KYC < 2 的使用者');
      process.exit(1);
    }

    const seller = newSeller.rows[0];
    console.log(`👤 使用賣家: ${seller.name} (KYC: ${seller.kyc_level}, 上架數: ${seller.listing_count})`);

    // Find a valid ticket owned by this user
    const ticket = await pool.query(`
      SELECT ticket_id, face_value
      FROM ticket
      WHERE owner_id = $1 AND status = 'Valid'
        AND ticket_id NOT IN (
          SELECT li.ticket_id 
          FROM listing_item li
          JOIN listing l ON li.listing_id = l.listing_id
          WHERE l.status IN ('Active', 'Pending')
        )
      LIMIT 1
    `, [seller.user_id]);

    if (ticket.rows.length === 0) {
      console.log('❌ 此賣家沒有可用的票券（可能都已上架）');
      process.exit(1);
    }

    const testTicket = ticket.rows[0];
    const faceValue = parseFloat(testTicket.face_value);
    const highPrice = faceValue * 1.5; // 150% of face value to trigger HighPrice flag

    console.log(`\n🎫 使用票券: #${testTicket.ticket_id}`);
    console.log(`   面額: NT$ ${faceValue}`);
    console.log(`   設定售價: NT$ ${highPrice} (${(highPrice / faceValue * 100).toFixed(0)}% 面額 - 會觸發高價風險)`);

    // Test risk assessment first
    const riskFlags = await assessListingRisk(seller.user_id, [{
      ticketId: testTicket.ticket_id,
      price: highPrice,
      faceValue: faceValue
    }]);

    console.log(`\n📊 風險評估結果: ${riskFlags.length} 個風險標記`);
    riskFlags.forEach(flag => {
      console.log(`   - ${flag.type}: ${flag.reason}`);
    });

    if (riskFlags.length === 0) {
      console.log('\n⚠️  警告: 沒有風險標記，上架會直接設為 Active');
      console.log('   這不應該發生，因為我們設定了高價');
    }

    const initialStatus = riskFlags.length > 0 ? 'Pending' : 'Active';
    console.log(`\n📝 上架狀態: ${initialStatus}`);

    // Create the listing
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const listingResult = await client.query(
        `INSERT INTO listing (seller_id, expires_at, status)
         VALUES ($1, $2, $3)
         RETURNING listing_id, created_at, status`,
        [seller.user_id, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), initialStatus]
      );

      const listingId = listingResult.rows[0].listing_id;
      console.log(`\n✅ 上架已建立: #${listingId}`);

      // Save risk flags
      if (riskFlags.length > 0) {
        await saveRiskFlags(listingId, riskFlags);
        console.log(`✅ 風險標記已保存`);
      }

      // Create listing item
      await client.query(
        `INSERT INTO listing_item (listing_id, ticket_id, price, status)
         VALUES ($1, $2, $3, $4)`,
        [listingId, testTicket.ticket_id, highPrice, initialStatus]
      );
      console.log(`✅ 上架項目已建立`);

      await client.query('COMMIT');

      console.log(`\n🎉 測試上架建立完成！`);
      console.log(`   上架 ID: ${listingId}`);
      console.log(`   狀態: ${initialStatus}`);
      console.log(`   風險標記數: ${riskFlags.length}`);
      console.log(`\n💡 現在可以在審核頁面看到這個待審核上架了！`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 錯誤:', error);
    process.exit(1);
  }
}

createTestPendingListing();

