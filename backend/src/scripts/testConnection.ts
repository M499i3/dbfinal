/**
 * 資料庫連線測試腳本
 * 用於測試 Neon PostgreSQL 和 MongoDB 的連線狀態
 * 
 * 執行方式：
 * npm run db:test
 * 或
 * tsx src/scripts/testConnection.ts
 */

import dotenv from 'dotenv';

// 載入環境變數（必須在導入配置檔案之前）
dotenv.config();

import pool from '../config/database.js';
import { connectMongoDB, closeMongoDB, getMongoDB } from '../config/mongodb.js';

async function testPostgreSQL() {
  console.log('\n📊 測試 PostgreSQL (Neon) 連線...');
  
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ PostgreSQL 連線成功！');
    console.log(`   當前時間: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL 版本: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    
    // 測試資料庫名稱
    const dbResult = await pool.query('SELECT current_database() as db_name');
    console.log(`   資料庫名稱: ${dbResult.rows[0].db_name}`);
    
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL 連線失敗:', error);
    return false;
  }
}

async function testMongoDB() {
  console.log('\n🍃 測試 MongoDB 連線...');
  
  try {
    const db = await connectMongoDB();
    
    // 測試連線
    await db.admin().ping();
    console.log('✅ MongoDB 連線成功！');
    
    // 取得資料庫資訊
    const dbName = db.databaseName;
    console.log(`   資料庫名稱: ${dbName}`);
    
    // 列出所有 collections
    const collections = await db.listCollections().toArray();
    console.log(`   現有 Collections: ${collections.length > 0 ? collections.map(c => c.name).join(', ') : '無'}`);
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB 連線失敗:', error);
    return false;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        資料庫連線測試                                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  const pgResult = await testPostgreSQL();
  const mongoResult = await testMongoDB();
  
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                    測試結果                              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`PostgreSQL (Neon): ${pgResult ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`MongoDB:           ${mongoResult ? '✅ 成功' : '❌ 失敗'}`);
  
  // 關閉連線
  await closeMongoDB();
  await pool.end();
  
  if (pgResult && mongoResult) {
    console.log('\n🎉 所有資料庫連線測試通過！');
    process.exit(0);
  } else {
    console.log('\n⚠️  部分資料庫連線失敗，請檢查環境變數設定');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('測試過程中發生錯誤:', error);
  process.exit(1);
});

