import pool from '../config/database';

async function addListingReviewSystem() {
  try {
    console.log('🔧 開始添加上架審核系統...');

    // 1. Create listing_risk_flag table to store risk assessment
    console.log('1. 建立 listing_risk_flag 表...');
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
    console.log('✅ listing_risk_flag 表建立成功');

    // 2. Add index for faster queries
    console.log('2. 建立索引...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_listing_risk_flag_listing 
      ON listing_risk_flag(listing_id);
    `);
    console.log('✅ 索引建立成功');

    // 3. Update listing status constraint to include 'Pending' and 'Rejected'
    console.log('3. 更新 listing status 欄位約束...');
    
    // Drop old constraint
    await pool.query(`
      ALTER TABLE listing 
      DROP CONSTRAINT IF EXISTS listing_status_check;
    `);
    
    // Add new constraint with Pending and Rejected
    await pool.query(`
      ALTER TABLE listing 
      ADD CONSTRAINT listing_status_check 
      CHECK (status IN ('Pending', 'Active', 'Sold', 'Expired', 'Cancelled', 'Rejected'));
    `);
    console.log('✅ listing status 約束更新成功');

    // 4. Do the same for listing_item
    console.log('4. 更新 listing_item status 欄位約束...');
    
    await pool.query(`
      ALTER TABLE listing_item 
      DROP CONSTRAINT IF EXISTS listing_item_status_check;
    `);
    
    await pool.query(`
      ALTER TABLE listing_item 
      ADD CONSTRAINT listing_item_status_check 
      CHECK (status IN ('Pending', 'Active', 'Sold', 'Expired', 'Cancelled', 'Rejected'));
    `);
    console.log('✅ listing_item status 約束更新成功');

    console.log('\n✅ 上架審核系統建立完成！');
    console.log('現在 listing 可以使用以下狀態：');
    console.log('  - Pending: 待審核');
    console.log('  - Active: 進行中');
    console.log('  - Sold: 已售出');
    console.log('  - Expired: 已過期');
    console.log('  - Cancelled: 已取消');
    console.log('  - Rejected: 已拒絕');

    process.exit(0);
  } catch (error) {
    console.error('❌ 錯誤:', error);
    process.exit(1);
  }
}

addListingReviewSystem();

