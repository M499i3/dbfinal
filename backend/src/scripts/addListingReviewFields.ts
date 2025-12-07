import pool from '../config/database';

async function addListingReviewFields() {
  try {
    console.log('🔧 開始更新 listing 表結構...');

    // Add new columns
    await pool.query(`
      ALTER TABLE listing 
      ADD COLUMN IF NOT EXISTS risk_flags TEXT,
      ADD COLUMN IF NOT EXISTS reviewed_by BIGINT,
      ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
    `);
    console.log('✅ 新增欄位成功');

    // Update status constraint to include new statuses
    await pool.query(`
      ALTER TABLE listing 
      DROP CONSTRAINT IF EXISTS listing_status_check;
    `);
    
    await pool.query(`
      ALTER TABLE listing 
      ADD CONSTRAINT listing_status_check 
      CHECK (status IN ('Pending', 'Active', 'Sold', 'Expired', 'Cancelled', 'Rejected'));
    `);
    console.log('✅ 更新狀態約束成功');

    // Add foreign key for reviewed_by
    await pool.query(`
      ALTER TABLE listing 
      ADD CONSTRAINT fk_listing_reviewed_by 
      FOREIGN KEY (reviewed_by) REFERENCES "user"(user_id) ON DELETE SET NULL ON UPDATE CASCADE;
    `);
    console.log('✅ 新增外鍵約束成功');

    console.log('✅ 所有更新完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 更新失敗:', error);
    process.exit(1);
  }
}

addListingReviewFields();

