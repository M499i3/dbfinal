/**
 * 檢查 MongoDB URI 格式（不顯示完整密碼）
 */

import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.log('❌ MONGODB_URI 未設定');
  process.exit(1);
}

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║        MongoDB URI 格式檢查                              ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

// 檢查是否為 Atlas 連接字串
if (mongoUri.includes('mongodb+srv://')) {
  console.log('✅ 偵測到 MongoDB Atlas 連接字串 (mongodb+srv://)');
  
  // 解析連接字串
  try {
    const match = mongoUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?/);
    
    if (match) {
      const username = match[1];
      const password = match[2];
      const cluster = match[3];
      const database = match[4] ? match[4].substring(1) : '未指定';
      const options = match[5] || '無';
      
      console.log(`\n📋 連接字串解析：`);
      console.log(`   使用者名稱: ${username}`);
      console.log(`   密碼長度: ${password.length} 字元`);
      console.log(`   叢集: ${cluster}`);
      console.log(`   資料庫: ${database}`);
      console.log(`   選項: ${options}`);
      
      // 檢查密碼中是否有未編碼的特殊字元
      const specialChars = ['@', ':', '/', '?', '#', '[', ']'];
      const unencodedChars = specialChars.filter(char => password.includes(char));
      
      if (unencodedChars.length > 0) {
        console.log(`\n⚠️  警告：密碼中包含未編碼的特殊字元: ${unencodedChars.join(', ')}`);
        console.log(`   這些字元需要進行 URL 編碼：`);
        console.log(`   @ → %40`);
        console.log(`   : → %3A`);
        console.log(`   / → %2F`);
        console.log(`   ? → %3F`);
        console.log(`   # → %23`);
        console.log(`   [ → %5B`);
        console.log(`   ] → %5D`);
      } else {
        console.log(`\n✅ 密碼格式檢查通過（無未編碼的特殊字元）`);
      }
    } else {
      console.log('⚠️  無法解析連接字串格式');
      console.log('   預期格式: mongodb+srv://username:password@cluster.mongodb.net/');
    }
  } catch (error) {
    console.log('❌ 解析連接字串時發生錯誤:', error);
  }
} else if (mongoUri.includes('mongodb://')) {
  console.log('✅ 偵測到標準 MongoDB 連接字串 (mongodb://)');
  console.log('   這可能是本地 MongoDB 或舊版連接字串');
} else {
  console.log('⚠️  無法識別的連接字串格式');
  console.log('   預期格式: mongodb+srv://... 或 mongodb://...');
}

console.log('\n💡 建議：');
console.log('   1. 確認 MongoDB Atlas 中的使用者名稱和密碼正確');
console.log('   2. 如果密碼包含特殊字元，請進行 URL 編碼');
console.log('   3. 確認 IP 白名單設定允許你的 IP 連線');
console.log('   4. 確認資料庫使用者有正確的權限');





