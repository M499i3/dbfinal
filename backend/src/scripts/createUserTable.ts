/**
 * 在 Neon 資料庫中建立 user 表
 * 根據 database/schema.sql 的格式
 */

import dotenv from 'dotenv';
dotenv.config();

import pool from '../config/database.js';

async function createUserTable() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        建立 User 表                                      ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    // 建立 user 表
    console.log('📊 正在建立 user 表...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        user_id BIGSERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(20) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        kyc_level INT NOT NULL DEFAULT 0 CHECK (kyc_level >= 0 AND kyc_level <= 2),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ user 表建立成功！\n');

    // 建立 user_role 表（因為註冊時會用到）
    console.log('📊 正在建立 user_role 表...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_role (
        user_id BIGINT NOT NULL,
        role VARCHAR(10) NOT NULL CHECK (role IN ('User', 'Admin')),
        PRIMARY KEY (user_id, role),
        FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    console.log('✅ user_role 表建立成功！\n');

    // 建立 blacklist 表（因為登入時會檢查）
    console.log('📊 正在建立 blacklist 表...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blacklist (
        user_id BIGINT PRIMARY KEY,
        reason VARCHAR(200) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    console.log('✅ blacklist 表建立成功！\n');

    // 建立 risk_event 表（因為登入時會記錄）
    console.log('📊 正在建立 risk_event 表...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS risk_event (
        risk_id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        type VARCHAR(50) NOT NULL,
        level INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    console.log('✅ risk_event 表建立成功！\n');

    // 檢查表是否建立成功
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user', 'user_role', 'blacklist', 'risk_event')
      ORDER BY table_name;
    `);

    console.log('📋 已建立的表：');
    tableCheck.rows.forEach((row) => {
      console.log(`   ✅ ${row.table_name}`);
    });

    console.log('\n🎉 所有必要的表已成功建立！');
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 建立表時發生錯誤:', error.message);
    
    // 如果是表已存在的錯誤，不算失敗
    if (error.code === '42P07' || error.message.includes('already exists')) {
      console.log('\n💡 提示：表可能已經存在，這是正常的。');
      await pool.end();
      process.exit(0);
    }
    
    await pool.end();
    process.exit(1);
  }
}

createUserTable();



