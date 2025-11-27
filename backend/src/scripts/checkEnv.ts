/**
 * 檢查環境變數是否正確載入
 * 不會顯示實際的敏感資訊，只顯示是否已設定
 */

import dotenv from 'dotenv';

// 載入環境變數
dotenv.config();

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║        環境變數檢查                                      ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

// 檢查 PostgreSQL (Neon) 設定
console.log('📊 PostgreSQL (Neon) 設定:');
if (process.env.NEON_DATABASE_URL) {
  const url = process.env.NEON_DATABASE_URL;
  const masked = url.length > 20 
    ? url.substring(0, 20) + '...' + url.substring(url.length - 10)
    : '***';
  console.log(`   ✅ NEON_DATABASE_URL: 已設定 (${masked})`);
} else {
  console.log('   ⚠️  NEON_DATABASE_URL: 未設定');
  console.log('   使用個別參數:');
  console.log(`   - DB_HOST: ${process.env.DB_HOST || '未設定 (使用預設: localhost)'}`);
  console.log(`   - DB_PORT: ${process.env.DB_PORT || '未設定 (使用預設: 5432)'}`);
  console.log(`   - DB_NAME: ${process.env.DB_NAME || '未設定 (使用預設: encore)'}`);
  console.log(`   - DB_USER: ${process.env.DB_USER || '未設定 (使用預設: postgres)'}`);
  console.log(`   - DB_PASSWORD: ${process.env.DB_PASSWORD ? '已設定' : '未設定 (使用預設: postgres)'}`);
}

console.log('\n🍃 MongoDB 設定:');
if (process.env.MONGODB_URI) {
  const uri = process.env.MONGODB_URI;
  // 檢查是否為 Atlas 連接字串
  if (uri.includes('mongodb+srv://')) {
    const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@/);
    if (match) {
      console.log(`   ✅ MONGODB_URI: 已設定 (Atlas - 使用者: ${match[1]})`);
    } else {
      console.log(`   ✅ MONGODB_URI: 已設定 (Atlas)`);
    }
  } else {
    console.log(`   ✅ MONGODB_URI: 已設定 (${uri.substring(0, 30)}...)`);
  }
} else {
  console.log('   ⚠️  MONGODB_URI: 未設定 (使用預設: mongodb://localhost:27017)');
}
console.log(`   - MONGODB_DB_NAME: ${process.env.MONGODB_DB_NAME || '未設定 (使用預設: encore)'}`);

console.log('\n📝 其他設定:');
console.log(`   - PORT: ${process.env.PORT || '未設定 (使用預設: 3000)'}`);
console.log(`   - JWT_SECRET: ${process.env.JWT_SECRET ? '已設定' : '未設定'}`);

console.log('\n💡 提示:');
if (!process.env.NEON_DATABASE_URL && !process.env.DB_PASSWORD) {
  console.log('   ⚠️  請確認 .env 檔案中已設定 NEON_DATABASE_URL 或 DB_PASSWORD');
}
if (!process.env.MONGODB_URI) {
  console.log('   ⚠️  請確認 .env 檔案中已設定 MONGODB_URI');
}

