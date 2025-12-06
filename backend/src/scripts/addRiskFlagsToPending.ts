import pool from '../config/database.js';

async function addRiskFlagsToPending() {
  try {
    // Find pending listings without risk flags
    const pendingListings = await pool.query(`
      SELECT l.listing_id, l.seller_id, u.kyc_level
      FROM listing l
      JOIN "user" u ON l.seller_id = u.user_id
      LEFT JOIN listing_risk_flag lrf ON l.listing_id = lrf.listing_id
      WHERE l.status = 'Pending'
      GROUP BY l.listing_id, u.kyc_level
      HAVING COUNT(lrf.flag_id) = 0
    `);

    console.log(`找到 ${pendingListings.rows.length} 筆待審核上架沒有風險標記`);

    for (const listing of pendingListings.rows) {
      // Add NewSeller flag if KYC < 2
      if (parseInt(listing.kyc_level) < 2) {
        await pool.query(
          `INSERT INTO listing_risk_flag (listing_id, flag_type, flag_reason)
           VALUES ($1, $2, $3)`,
          [listing.listing_id, 'NewSeller', `新賣家 (KYC等級: ${listing.kyc_level})`]
        );
        console.log(`✅ 為上架 #${listing.listing_id} 添加 NewSeller 風險標記`);
      }

      // Check for high/low price
      const items = await pool.query(`
        SELECT li.price, t.face_value
        FROM listing_item li
        JOIN ticket t ON li.ticket_id = t.ticket_id
        WHERE li.listing_id = $1
      `, [listing.listing_id]);

      for (const item of items.rows) {
        const price = parseFloat(item.price);
        const faceValue = parseFloat(item.face_value);
        const ratio = price / faceValue;

        if (ratio > 1.2) {
          await pool.query(
            `INSERT INTO listing_risk_flag (listing_id, flag_type, flag_reason)
             VALUES ($1, $2, $3)`,
            [listing.listing_id, 'HighPrice', `售價 ${price} 高於面額 ${faceValue} 的 120%`]
          );
          console.log(`✅ 為上架 #${listing.listing_id} 添加 HighPrice 風險標記`);
        } else if (ratio < 0.5) {
          await pool.query(
            `INSERT INTO listing_risk_flag (listing_id, flag_type, flag_reason)
             VALUES ($1, $2, $3)`,
            [listing.listing_id, 'LowPrice', `售價 ${price} 低於面額 ${faceValue} 的 50%`]
          );
          console.log(`✅ 為上架 #${listing.listing_id} 添加 LowPrice 風險標記`);
        }
      }
    }

    console.log('\n✅ 完成！現在待審核上架應該有風險標記了');
    process.exit(0);
  } catch (error) {
    console.error('❌ 錯誤:', error);
    process.exit(1);
  }
}

addRiskFlagsToPending();

