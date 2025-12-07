import pool from '../config/database';

async function addListingReviewColumns() {
  try {
    console.log('🔧 開始添加審核相關欄位...');

    // Add reviewed_by column
    await pool.query(`
      ALTER TABLE listing 
      ADD COLUMN IF NOT EXISTS reviewed_by BIGINT REFERENCES "user"(user_id)
    `);
    console.log('✅ reviewed_by 欄位添加成功');

    // Add reviewed_at column
    await pool.query(`
      ALTER TABLE listing 
      ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP
    `);
    console.log('✅ reviewed_at 欄位添加成功');

    // Add rejection_reason column
    await pool.query(`
      ALTER TABLE listing 
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT
    `);
    console.log('✅ rejection_reason 欄位添加成功');

    console.log('\n✅ 所有審核相關欄位添加完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 錯誤:', error);
    process.exit(1);
  }
}

addListingReviewColumns();

