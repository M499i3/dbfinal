import pool from '../config/database.js';

async function fixListingReviewSystem() {
  try {
    console.log('🔧 開始修復上架審核系統...');

    // 1. Create listing_risk_flag table if it doesn't exist
    console.log('1. 檢查並建立 listing_risk_flag 表...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS listing_risk_flag (
        flag_id BIGSERIAL PRIMARY KEY,
        listing_id BIGINT NOT NULL,
        flag_type VARCHAR(50) NOT NULL CHECK (flag_type IN (
          'HighPrice',
          'LowPrice', 
          'NewSeller',
          'HighQuantity',
          'BlacklistedSeller'
        )),
        flag_reason TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (listing_id) REFERENCES listing(listing_id) ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    console.log('✅ listing_risk_flag 表已就緒');

    // 2. Add index for faster queries
    console.log('2. 建立索引...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_listing_risk_flag_listing 
      ON listing_risk_flag(listing_id);
    `);
    console.log('✅ 索引已就緒');

    // 3. Fix listing_item status constraint to include 'Pending'
    console.log('3. 修復 listing_item status 欄位約束（加入 Pending）...');
    
    // Drop old constraint
    await pool.query(`
      ALTER TABLE listing_item 
      DROP CONSTRAINT IF EXISTS listing_item_status_check;
    `);
    
    // Add new constraint with Pending
    await pool.query(`
      ALTER TABLE listing_item 
      ADD CONSTRAINT listing_item_status_check 
      CHECK (status IN ('Pending', 'Active', 'Sold', 'Expired', 'Cancelled'));
    `);
    console.log('✅ listing_item status 約束已更新（包含 Pending）');

    // 4. Ensure listing status constraint includes 'Pending' and 'Rejected'
    console.log('4. 確保 listing status 欄位約束包含 Pending 和 Rejected...');
    
    await pool.query(`
      ALTER TABLE listing 
      DROP CONSTRAINT IF EXISTS listing_status_check;
    `);
    
    await pool.query(`
      ALTER TABLE listing 
      ADD CONSTRAINT listing_status_check 
      CHECK (status IN ('Pending', 'Active', 'Sold', 'Expired', 'Cancelled', 'Rejected'));
    `);
    console.log('✅ listing status 約束已更新');

    console.log('\n✅ 上架審核系統修復完成！');
    console.log('現在可以：');
    console.log('  - listing 可以使用 Pending 狀態');
    console.log('  - listing_item 可以使用 Pending 狀態');
    console.log('  - 風險標記會正確保存到 listing_risk_flag 表');

    process.exit(0);
  } catch (error) {
    console.error('❌ 錯誤:', error);
    process.exit(1);
  }
}

fixListingReviewSystem();

