import pool from '../config/database';

async function addCaseNotes() {
  try {
    console.log('🔧 開始建立案件備註系統...');

    // Create case_note table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS case_note (
        note_id BIGSERIAL PRIMARY KEY,
        case_id BIGINT NOT NULL,
        operator_id BIGINT NOT NULL,
        note_type VARCHAR(20) NOT NULL CHECK (note_type IN ('Investigation', 'Communication', 'Decision', 'Other')),
        content TEXT NOT NULL,
        is_internal BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES "case"(case_id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (operator_id) REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    console.log('✅ case_note 表建立成功');

    // Add index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_case_note_case ON case_note(case_id);
    `);
    console.log('✅ 索引建立成功');

    // Add description column to case table
    await pool.query(`
      ALTER TABLE "case" ADD COLUMN IF NOT EXISTS description TEXT;
    `);
    console.log('✅ description 欄位添加成功');

    // Add resolution column to case table
    await pool.query(`
      ALTER TABLE "case" ADD COLUMN IF NOT EXISTS resolution TEXT;
    `);
    console.log('✅ resolution 欄位添加成功');

    console.log('\n✅ 案件備註系統建立完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 錯誤:', error);
    process.exit(1);
  }
}

addCaseNotes();

