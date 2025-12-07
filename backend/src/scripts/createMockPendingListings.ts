import pool from '../config/database.js';
import { assessListingRisk } from '../utils/riskAssessment.js';

/**
 * Create multiple mock pending listings for testing and demo
 */
async function createMockPendingListings() {
  try {
    console.log('🎭 建立多個測試待審核上架...\n');

    const client = await pool.connect();
    let createdCount = 0;

    try {
      // Scenario 1: New seller with normal price (should trigger NewSeller flag)
      console.log('📝 情境 1: 新賣家 + 正常價格');
      const newSeller = await pool.query(`
        SELECT u.user_id, u.name, u.kyc_level, COUNT(l.listing_id) as listing_count
        FROM "user" u
        LEFT JOIN listing l ON u.user_id = l.seller_id
        WHERE u.kyc_level < 2
        GROUP BY u.user_id, u.name, u.kyc_level
        HAVING COUNT(l.listing_id) = 0
        LIMIT 1
      `);

      if (newSeller.rows.length > 0) {
        const seller = newSeller.rows[0];
        const ticket = await pool.query(`
          SELECT ticket_id, face_value
          FROM ticket
          WHERE owner_id = $1 AND status = 'Valid'
            AND ticket_id NOT IN (
              SELECT li.ticket_id FROM listing_item li
              JOIN listing l ON li.listing_id = l.listing_id
              WHERE l.status IN ('Active', 'Pending')
            )
          LIMIT 1
        `, [seller.user_id]);

        if (ticket.rows.length > 0) {
          const t = ticket.rows[0];
          const price = parseFloat(t.face_value) * 1.0; // Normal price
          
          await client.query('BEGIN');
          const listing = await client.query(
            `INSERT INTO listing (seller_id, expires_at, status)
             VALUES ($1, $2, 'Pending')
             RETURNING listing_id`,
            [seller.user_id, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()]
          );
          const listingId = listing.rows[0].listing_id;
          
          await client.query(
            `INSERT INTO listing_item (listing_id, ticket_id, price, status)
             VALUES ($1, $2, $3, 'Pending')`,
            [listingId, t.ticket_id, price]
          );
          
          await client.query(
            `INSERT INTO listing_risk_flag (listing_id, flag_type, flag_reason)
             VALUES ($1, $2, $3)`,
            [listingId, 'NewSeller', `新賣家 (KYC等級: ${seller.kyc_level}, 歷史上架數: 0)`]
          );
          
          await client.query('COMMIT');
          console.log(`   ✅ 上架 #${listingId}: ${seller.name} - 新賣家風險`);
          createdCount++;
        }
      }

      // Scenario 2: High price listing (>120% of face value)
      console.log('\n📝 情境 2: 高價風險');
      const highPriceSeller = await pool.query(`
        SELECT u.user_id, u.name
        FROM "user" u
        WHERE u.user_id NOT IN (SELECT seller_id FROM listing WHERE status = 'Pending')
        LIMIT 1
      `);

      if (highPriceSeller.rows.length > 0) {
        const seller = highPriceSeller.rows[0];
        const ticket = await pool.query(`
          SELECT ticket_id, face_value
          FROM ticket
          WHERE owner_id = $1 AND status = 'Valid'
            AND ticket_id NOT IN (
              SELECT li.ticket_id FROM listing_item li
              JOIN listing l ON li.listing_id = l.listing_id
              WHERE l.status IN ('Active', 'Pending')
            )
          LIMIT 1
        `, [seller.user_id]);

        if (ticket.rows.length > 0) {
          const t = ticket.rows[0];
          const faceValue = parseFloat(t.face_value);
          const price = faceValue * 1.5; // 150% of face value
          
          await client.query('BEGIN');
          const listing = await client.query(
            `INSERT INTO listing (seller_id, expires_at, status)
             VALUES ($1, $2, 'Pending')
             RETURNING listing_id`,
            [seller.user_id, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()]
          );
          const listingId = listing.rows[0].listing_id;
          
          await client.query(
            `INSERT INTO listing_item (listing_id, ticket_id, price, status)
             VALUES ($1, $2, $3, 'Pending')`,
            [listingId, t.ticket_id, price]
          );
          
          await client.query(
            `INSERT INTO listing_risk_flag (listing_id, flag_type, flag_reason)
             VALUES ($1, $2, $3)`,
            [listingId, 'HighPrice', `票券 #${t.ticket_id}: 售價 $${price} 高於面額 $${faceValue} 的 120% (150%)`]
          );
          
          await client.query('COMMIT');
          console.log(`   ✅ 上架 #${listingId}: ${seller.name} - 高價風險 (${(price/faceValue*100).toFixed(0)}% 面額)`);
          createdCount++;
        }
      }

      // Scenario 3: Low price listing (<50% of face value)
      console.log('\n📝 情境 3: 低價風險');
      const lowPriceSeller = await pool.query(`
        SELECT u.user_id, u.name
        FROM "user" u
        WHERE u.user_id NOT IN (SELECT seller_id FROM listing WHERE status = 'Pending')
        LIMIT 1
      `);

      if (lowPriceSeller.rows.length > 0) {
        const seller = lowPriceSeller.rows[0];
        const ticket = await pool.query(`
          SELECT ticket_id, face_value
          FROM ticket
          WHERE owner_id = $1 AND status = 'Valid'
            AND ticket_id NOT IN (
              SELECT li.ticket_id FROM listing_item li
              JOIN listing l ON li.listing_id = l.listing_id
              WHERE l.status IN ('Active', 'Pending')
            )
          LIMIT 1
        `, [seller.user_id]);

        if (ticket.rows.length > 0) {
          const t = ticket.rows[0];
          const faceValue = parseFloat(t.face_value);
          const price = faceValue * 0.3; // 30% of face value
          
          await client.query('BEGIN');
          const listing = await client.query(
            `INSERT INTO listing (seller_id, expires_at, status)
             VALUES ($1, $2, 'Pending')
             RETURNING listing_id`,
            [seller.user_id, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()]
          );
          const listingId = listing.rows[0].listing_id;
          
          await client.query(
            `INSERT INTO listing_item (listing_id, ticket_id, price, status)
             VALUES ($1, $2, $3, 'Pending')`,
            [listingId, t.ticket_id, price]
          );
          
          await client.query(
            `INSERT INTO listing_risk_flag (listing_id, flag_type, flag_reason)
             VALUES ($1, $2, $3)`,
            [listingId, 'LowPrice', `票券 #${t.ticket_id}: 售價 $${price} 低於面額 $${faceValue} 的 50% (30%)`]
          );
          
          await client.query('COMMIT');
          console.log(`   ✅ 上架 #${listingId}: ${seller.name} - 低價風險 (${(price/faceValue*100).toFixed(0)}% 面額)`);
          createdCount++;
        }
      }

      // Scenario 4: New seller + High price (multiple risk flags)
      console.log('\n📝 情境 4: 新賣家 + 高價風險');
      const newSellerHighPrice = await pool.query(`
        SELECT u.user_id, u.name, u.kyc_level, COUNT(l.listing_id) as listing_count
        FROM "user" u
        LEFT JOIN listing l ON u.user_id = l.seller_id
        WHERE u.kyc_level < 2
        GROUP BY u.user_id, u.name, u.kyc_level
        HAVING COUNT(l.listing_id) <= 2
        LIMIT 1
      `);

      if (newSellerHighPrice.rows.length > 0) {
        const seller = newSellerHighPrice.rows[0];
        const tickets = await pool.query(`
          SELECT ticket_id, face_value
          FROM ticket
          WHERE owner_id = $1 AND status = 'Valid'
            AND ticket_id NOT IN (
              SELECT li.ticket_id FROM listing_item li
              JOIN listing l ON li.listing_id = l.listing_id
              WHERE l.status IN ('Active', 'Pending')
            )
          LIMIT 1
        `, [seller.user_id]);

        if (tickets.rows.length > 0) {
          const t = tickets.rows[0];
          const faceValue = parseFloat(t.face_value);
          const price = faceValue * 1.8; // 180% of face value
          
          await client.query('BEGIN');
          const listing = await client.query(
            `INSERT INTO listing (seller_id, expires_at, status)
             VALUES ($1, $2, 'Pending')
             RETURNING listing_id`,
            [seller.user_id, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()]
          );
          const listingId = listing.rows[0].listing_id;
          
          await client.query(
            `INSERT INTO listing_item (listing_id, ticket_id, price, status)
             VALUES ($1, $2, $3, 'Pending')`,
            [listingId, t.ticket_id, price]
          );
          
          await client.query(
            `INSERT INTO listing_risk_flag (listing_id, flag_type, flag_reason)
             VALUES ($1, $2, $3)`,
            [listingId, 'NewSeller', `新賣家 (KYC等級: ${seller.kyc_level}, 歷史上架數: ${seller.listing_count})`]
          );
          
          await client.query(
            `INSERT INTO listing_risk_flag (listing_id, flag_type, flag_reason)
             VALUES ($1, $2, $3)`,
            [listingId, 'HighPrice', `票券 #${t.ticket_id}: 售價 $${price} 高於面額 $${faceValue} 的 120% (180%)`]
          );
          
          await client.query('COMMIT');
          console.log(`   ✅ 上架 #${listingId}: ${seller.name} - 新賣家 + 高價風險`);
          createdCount++;
        }
      }

      // Scenario 5: High quantity (>5 tickets)
      console.log('\n📝 情境 5: 大量上架風險');
      const highQuantitySeller = await pool.query(`
        SELECT u.user_id, u.name
        FROM "user" u
        WHERE u.user_id NOT IN (SELECT seller_id FROM listing WHERE status = 'Pending')
        LIMIT 1
      `);

      if (highQuantitySeller.rows.length > 0) {
        const seller = highQuantitySeller.rows[0];
        const tickets = await pool.query(`
          SELECT ticket_id, face_value
          FROM ticket
          WHERE owner_id = $1 AND status = 'Valid'
            AND ticket_id NOT IN (
              SELECT li.ticket_id FROM listing_item li
              JOIN listing l ON li.listing_id = l.listing_id
              WHERE l.status IN ('Active', 'Pending')
            )
          LIMIT 6
        `, [seller.user_id]);

        if (tickets.rows.length >= 6) {
          await client.query('BEGIN');
          const listing = await client.query(
            `INSERT INTO listing (seller_id, expires_at, status)
             VALUES ($1, $2, 'Pending')
             RETURNING listing_id`,
            [seller.user_id, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()]
          );
          const listingId = listing.rows[0].listing_id;
          
          for (const t of tickets.rows) {
            const price = parseFloat(t.face_value) * 1.0;
            await client.query(
              `INSERT INTO listing_item (listing_id, ticket_id, price, status)
               VALUES ($1, $2, $3, 'Pending')`,
              [listingId, t.ticket_id, price]
            );
          }
          
          await client.query(
            `INSERT INTO listing_risk_flag (listing_id, flag_type, flag_reason)
             VALUES ($1, $2, $3)`,
            [listingId, 'HighQuantity', `一次上架 ${tickets.rows.length} 張票券（超過5張）`]
          );
          
          await client.query('COMMIT');
          console.log(`   ✅ 上架 #${listingId}: ${seller.name} - 大量上架風險 (${tickets.rows.length} 張)`);
          createdCount++;
        }
      }

      // Scenario 6-10: Create more variations
      console.log('\n📝 情境 6-10: 建立更多變化...');
      for (let i = 0; i < 5; i++) {
        const seller = await pool.query(`
          SELECT u.user_id, u.name, u.kyc_level, COUNT(l.listing_id) as listing_count
          FROM "user" u
          LEFT JOIN listing l ON u.user_id = l.seller_id
          WHERE u.user_id NOT IN (SELECT seller_id FROM listing WHERE status = 'Pending')
          GROUP BY u.user_id, u.name, u.kyc_level
          LIMIT 1
        `);

        if (seller.rows.length > 0) {
          const s = seller.rows[0];
          const ticket = await pool.query(`
            SELECT ticket_id, face_value
            FROM ticket
            WHERE owner_id = $1 AND status = 'Valid'
              AND ticket_id NOT IN (
                SELECT li.ticket_id FROM listing_item li
                JOIN listing l ON li.listing_id = l.listing_id
                WHERE l.status IN ('Active', 'Pending')
              )
            LIMIT 1
          `, [s.user_id]);

          if (ticket.rows.length > 0) {
            const t = ticket.rows[0];
            const faceValue = parseFloat(t.face_value);
            // Vary the price to create different scenarios
            const priceMultiplier = [1.3, 1.4, 0.4, 0.45, 1.25][i % 5];
            const price = faceValue * priceMultiplier;
            const riskType = priceMultiplier > 1.2 ? 'HighPrice' : 
                           priceMultiplier < 0.5 ? 'LowPrice' : 
                           parseInt(s.listing_count) === 0 || parseInt(s.kyc_level) < 2 ? 'NewSeller' : null;
            
            if (riskType) {
              await client.query('BEGIN');
              const listing = await client.query(
                `INSERT INTO listing (seller_id, expires_at, status)
                 VALUES ($1, $2, 'Pending')
                 RETURNING listing_id`,
                [s.user_id, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()]
              );
              const listingId = listing.rows[0].listing_id;
              
              await client.query(
                `INSERT INTO listing_item (listing_id, ticket_id, price, status)
                 VALUES ($1, $2, $3, 'Pending')`,
                [listingId, t.ticket_id, price]
              );
              
              let reason = '';
              if (riskType === 'HighPrice') {
                reason = `票券 #${t.ticket_id}: 售價 $${price} 高於面額 $${faceValue} 的 120% (${(priceMultiplier*100).toFixed(0)}%)`;
              } else if (riskType === 'LowPrice') {
                reason = `票券 #${t.ticket_id}: 售價 $${price} 低於面額 $${faceValue} 的 50% (${(priceMultiplier*100).toFixed(0)}%)`;
              } else {
                reason = `新賣家 (KYC等級: ${s.kyc_level}, 歷史上架數: ${s.listing_count})`;
              }
              
              await client.query(
                `INSERT INTO listing_risk_flag (listing_id, flag_type, flag_reason)
                 VALUES ($1, $2, $3)`,
                [listingId, riskType, reason]
              );
              
              await client.query('COMMIT');
              console.log(`   ✅ 上架 #${listingId}: ${s.name} - ${riskType}`);
              createdCount++;
            }
          }
        }
      }

      console.log(`\n🎉 完成！總共建立了 ${createdCount} 筆待審核上架`);
      console.log(`\n💡 現在可以在審核頁面看到這些待審核上架了！`);

    } finally {
      client.release();
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 錯誤:', error);
    process.exit(1);
  }
}

createMockPendingListings();

