/**
 * 測試註冊和登入 API
 */

import dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testRegister() {
  console.log('\n📝 測試註冊功能...');
  
  const testUser = {
    name: '測試使用者',
    email: `test_${Date.now()}@example.com`,
    phone: `0912${Math.floor(Math.random() * 1000000)}`,
    password: 'test123456',
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ 註冊成功！');
      console.log(`   使用者 ID: ${data.user.userId}`);
      console.log(`   姓名: ${data.user.name}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Token: ${data.token.substring(0, 20)}...`);
      return { success: true, user: testUser, token: data.token };
    } else {
      console.log('❌ 註冊失敗:', data.error);
      return { success: false };
    }
  } catch (error: any) {
    console.log('❌ 註冊請求失敗:', error.message);
    return { success: false };
  }
}

async function testLogin(email: string, password: string) {
  console.log('\n🔐 測試登入功能...');

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ 登入成功！');
      console.log(`   使用者 ID: ${data.user.userId}`);
      console.log(`   姓名: ${data.user.name}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   角色: ${data.user.roles.join(', ')}`);
      console.log(`   Token: ${data.token.substring(0, 20)}...`);
      return { success: true, token: data.token };
    } else {
      console.log('❌ 登入失敗:', data.error);
      return { success: false };
    }
  } catch (error: any) {
    console.log('❌ 登入請求失敗:', error.message);
    return { success: false };
  }
}

async function testGetProfile(token: string) {
  console.log('\n👤 測試取得個人資料...');

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ 取得個人資料成功！');
      console.log(`   使用者 ID: ${data.userId}`);
      console.log(`   姓名: ${data.name}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   電話: ${data.phone}`);
      console.log(`   KYC 等級: ${data.kycLevel}`);
      console.log(`   角色: ${data.roles.join(', ')}`);
      return { success: true };
    } else {
      console.log('❌ 取得個人資料失敗:', data.error);
      return { success: false };
    }
  } catch (error: any) {
    console.log('❌ 取得個人資料請求失敗:', error.message);
    return { success: false };
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        認證 API 測試                                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\nAPI 端點: ${API_BASE_URL}`);

  // 檢查伺服器是否運行
  try {
    const healthCheck = await fetch(`${API_BASE_URL}/api/health`);
    if (!healthCheck.ok) {
      console.log('\n⚠️  警告：無法連接到 API 伺服器');
      console.log('   請確認伺服器正在運行: npm run dev');
      process.exit(1);
    }
  } catch (error) {
    console.log('\n⚠️  警告：無法連接到 API 伺服器');
    console.log('   請確認伺服器正在運行: npm run dev');
    process.exit(1);
  }

  // 測試註冊
  const registerResult = await testRegister();
  
  if (!registerResult.success) {
    console.log('\n❌ 註冊測試失敗，無法繼續測試');
    process.exit(1);
  }

  // 測試登入
  const loginResult = await testLogin(registerResult.user!.email, registerResult.user!.password);
  
  if (!loginResult.success) {
    console.log('\n❌ 登入測試失敗');
    process.exit(1);
  }

  // 測試取得個人資料
  const profileResult = await testGetProfile(loginResult.token!);

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                    測試結果                              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`註冊: ${registerResult.success ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`登入: ${loginResult.success ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`取得個人資料: ${profileResult.success ? '✅ 成功' : '❌ 失敗'}`);

  if (registerResult.success && loginResult.success && profileResult.success) {
    console.log('\n🎉 所有認證 API 測試通過！');
    process.exit(0);
  } else {
    console.log('\n⚠️  部分測試失敗');
    process.exit(1);
  }
}

main();

