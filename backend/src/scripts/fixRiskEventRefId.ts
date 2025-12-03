import pool from '../config/database';

async function fixRiskEventRefId() {
  try {
    console.log('🔧 開始修復 risk_event 表的 ref_id 欄位...');

    // 修改 ref_id 欄位為可空
    await pool.query(`
      ALTER TABLE risk_event 
      ALTER COLUMN ref_id DROP NOT NULL;
    `);

    console.log('✅ ref_id 欄位已成功設置為可空');

    process.exit(0);
  } catch (error) {
    console.error('❌ 修復失敗:', error);
    process.exit(1);
  }
}

fixRiskEventRefId();

