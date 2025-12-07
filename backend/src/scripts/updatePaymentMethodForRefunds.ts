import pool from '../config/database';

async function updatePaymentMethodForRefunds() {
  try {
    console.log('🔧 更新 payment 表以支援退款...');

    // Drop old constraint
    await pool.query(`
      ALTER TABLE payment 
      DROP CONSTRAINT IF EXISTS payment_method_check;
    `);
    console.log('✅ 舊約束已移除');

    // Add new constraint with Refund
    await pool.query(`
      ALTER TABLE payment 
      ADD CONSTRAINT payment_method_check 
      CHECK (method IN ('CreditCard', 'Bank', 'Wallet', 'Refund'));
    `);
    console.log('✅ 新約束已建立（包含 Refund）');

    // Also make order_id not unique since we can have payment + refund for same order
    await pool.query(`
      ALTER TABLE payment 
      DROP CONSTRAINT IF EXISTS payment_order_id_key;
    `);
    console.log('✅ order_id UNIQUE 約束已移除（允許同訂單多筆記錄）');

    console.log('\n✅ Payment 表更新完成！現在可以處理退款。');
    process.exit(0);
  } catch (error) {
    console.error('❌ 錯誤:', error);
    process.exit(1);
  }
}

updatePaymentMethodForRefunds();

