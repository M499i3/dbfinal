/**
 * 遷移腳本：更新 user_role 表以支援 BusinessOperator 角色
 */

import dotenv from 'dotenv';
dotenv.config();

import pool from '../config/database.js';

async function migrate() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        更新 user_role 表以支援 BusinessOperator          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    // 刪除舊的 CHECK 約束
    console.log('📝 刪除舊的 CHECK 約束...');
    await pool.query(`
      ALTER TABLE user_role 
      DROP CONSTRAINT IF EXISTS user_role_role_check;
    `);

    // 更新 role 欄位長度
    console.log('📝 更新 role 欄位長度...');
    await pool.query(`
      ALTER TABLE user_role 
      ALTER COLUMN role TYPE VARCHAR(20);
    `);

    // 添加新的 CHECK 約束
    console.log('📝 添加新的 CHECK 約束...');
    await pool.query(`
      ALTER TABLE user_role 
      ADD CONSTRAINT user_role_role_check 
      CHECK (role IN ('User', 'BusinessOperator', 'Admin'));
    `);

    console.log('✅ 遷移完成！user_role 表現在支援 BusinessOperator 角色');
  } catch (error: any) {
    if (error.code === '42704') {
      // 約束不存在，可能已經更新過
      console.log('⏭️  約束不存在，可能已經更新過，繼續執行...');
      try {
        await pool.query(`
          ALTER TABLE user_role 
          ALTER COLUMN role TYPE VARCHAR(20);
        `);
        await pool.query(`
          ALTER TABLE user_role 
          ADD CONSTRAINT user_role_role_check 
          CHECK (role IN ('User', 'BusinessOperator', 'Admin'));
        `);
        console.log('✅ 遷移完成！');
      } catch (e: any) {
        console.error('❌ 遷移失敗:', e.message);
      }
    } else {
      console.error('❌ 遷移失敗:', error.message);
    }
  }

  await pool.end();
  process.exit(0);
}

migrate().catch((error) => {
  console.error('遷移時發生錯誤:', error);
  process.exit(1);
});

