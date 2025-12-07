import pool from '../config/database.js';

export interface RiskFlag {
  type: 'HighPrice' | 'LowPrice' | 'NewSeller' | 'HighQuantity' | 'BlacklistedSeller';
  reason: string;
}

export async function assessListingRisk(
  sellerId: number,
  tickets: { ticketId: number; price: number; faceValue: number }[]
): Promise<RiskFlag[]> {
  const flags: RiskFlag[] = [];

  try {
    // 1. Check if seller is blacklisted
    const blacklistCheck = await pool.query(
      'SELECT user_id FROM blacklist WHERE user_id = $1',
    [sellerId]
  );

    if (blacklistCheck.rows.length > 0) {
      flags.push({
        type: 'BlacklistedSeller',
        reason: '賣家在黑名單中',
    });
  }

    // 2. Check if seller is new (first listing or KYC level < 2)
    // Note: This counts EXISTING listings, not the one being created
    const sellerCheck = await pool.query(
      `SELECT 
        u.kyc_level,
        COUNT(l.listing_id) as listing_count
      FROM "user" u
      LEFT JOIN listing l ON u.user_id = l.seller_id
      WHERE u.user_id = $1
      GROUP BY u.user_id, u.kyc_level`,
    [sellerId]
  );

    if (sellerCheck.rows.length > 0) {
      const seller = sellerCheck.rows[0];
      // Flag as NewSeller if: no previous listings OR KYC level < 2
      if (parseInt(seller.listing_count) === 0 || parseInt(seller.kyc_level) < 2) {
        flags.push({
          type: 'NewSeller',
          reason: `新賣家 (KYC等級: ${seller.kyc_level}, 歷史上架數: ${seller.listing_count})`,
        });
      }
    }

    // 3. Check ticket quantity
  if (tickets.length > 5) {
      flags.push({
        type: 'HighQuantity',
        reason: `一次上架 ${tickets.length} 張票券（超過5張）`,
    });
  }

    // 4. Check prices for each ticket
  for (const ticket of tickets) {
    const priceRatio = ticket.price / ticket.faceValue;

      // High price: > 120% of face value
    if (priceRatio > 1.2) {
        flags.push({
          type: 'HighPrice',
          reason: `票券 #${ticket.ticketId}: 售價 $${ticket.price} 高於面額 $${ticket.faceValue} 的 120% (${(priceRatio * 100).toFixed(0)}%)`,
      });
    }

      // Low price: < 50% of face value
    if (priceRatio < 0.5) {
        flags.push({
          type: 'LowPrice',
          reason: `票券 #${ticket.ticketId}: 售價 $${ticket.price} 低於面額 $${ticket.faceValue} 的 50% (${(priceRatio * 100).toFixed(0)}%)`,
      });
    }
  }

    return flags;
  } catch (error) {
    console.error('風險評估錯誤:', error);
    return [];
  }
}

export async function saveRiskFlags(listingId: number, flags: RiskFlag[]): Promise<void> {
  try {
    for (const flag of flags) {
      await pool.query(
        `INSERT INTO listing_risk_flag (listing_id, flag_type, flag_reason)
         VALUES ($1, $2, $3)`,
        [listingId, flag.type, flag.reason]
      );
    }
  } catch (error) {
    console.error('保存風險標記錯誤:', error);
  }
}

export async function getRiskFlags(listingId: number): Promise<RiskFlag[]> {
  try {
    const result = await pool.query(
      `SELECT flag_type as type, flag_reason as reason
       FROM listing_risk_flag
       WHERE listing_id = $1
       ORDER BY created_at ASC`,
      [listingId]
    );
    
    return result.rows;
  } catch (error) {
    console.error('獲取風險標記錯誤:', error);
    return [];
}
}
