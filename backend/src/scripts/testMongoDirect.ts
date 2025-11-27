/**
 * 直接測試 MongoDB 連線（使用更詳細的錯誤訊息）
 */

import dotenv from 'dotenv';
dotenv.config();

import { MongoClient } from 'mongodb';

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.log('❌ MONGODB_URI 未設定');
  process.exit(1);
}

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║        MongoDB 直接連線測試                              ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

// 解析連接字串以顯示資訊（不顯示完整密碼）
const uriMatch = mongoUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)/);
if (uriMatch) {
  console.log(`使用者名稱: ${uriMatch[1]}`);
  console.log(`密碼長度: ${uriMatch[2].length} 字元`);
  console.log(`叢集: ${uriMatch[3]}\n`);
}

async function testConnection() {
  const client = new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 5000, // 5 秒超時
  });

  try {
    console.log('正在嘗試連線...');
    await client.connect();
    console.log('✅ 連線成功！');
    
    // 測試 ping
    await client.db().admin().ping();
    console.log('✅ Ping 成功！');
    
    // 列出資料庫
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    console.log(`\n可用的資料庫: ${dbs.databases.map((db: any) => db.name).join(', ')}`);
    
    await client.close();
    console.log('\n🎉 MongoDB 連線測試完全成功！');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 連線失敗:');
    
    if (error.code === 8000 || error.codeName === 'AtlasError') {
      console.error('   錯誤類型: MongoDB Atlas 認證錯誤');
      console.error('   可能原因:');
      console.error('   1. 使用者名稱或密碼錯誤');
      console.error('   2. 使用者不存在或已被刪除');
      console.error('   3. 使用者沒有資料庫存取權限');
      console.error('\n💡 建議:');
      console.error('   1. 登入 MongoDB Atlas Console');
      console.error('   2. 前往 Database Access 頁面');
      console.error('   3. 確認使用者名稱: ' + (uriMatch ? uriMatch[1] : '未知'));
      console.error('   4. 檢查使用者密碼是否正確');
      console.error('   5. 確認使用者有 "Read and write to any database" 權限');
      console.error('   6. 如果密碼錯誤，可以重置密碼');
    } else if (error.message?.includes('authentication failed')) {
      console.error('   錯誤類型: 認證失敗');
      console.error('   請檢查使用者名稱和密碼');
    } else {
      console.error('   錯誤訊息:', error.message);
      console.error('   錯誤代碼:', error.code || error.codeName);
    }
    
    await client.close();
    process.exit(1);
  }
}

testConnection();

