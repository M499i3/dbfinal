import pool from '../config/database.js';

/**
 * 檢查並取消超時未付款的訂單
 * 訂單創建後 5 分鐘內未付款將自動取消
 */
export async function cancelExpiredOrders(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 查找超過 5 分鐘未付款的訂單
    // 條件：狀態為 Pending，創建時間超過 5 分鐘，付款狀態為 Pending
    const expiredOrders = await client.query(
      `SELECT o.order_id, o.buyer_id
       FROM "order" o
       JOIN payment p ON o.order_id = p.order_id
       WHERE o.status = 'Pending'
       AND p.status = 'Pending'
       AND o.created_at < NOW() - INTERVAL '5 minutes'
       FOR UPDATE`,
    );

    if (expiredOrders.rows.length === 0) {
      await client.query('COMMIT');
      return;
    }

    console.log(`[訂單超時檢查] 發現 ${expiredOrders.rows.length} 筆超時訂單，開始取消...`);

    for (const order of expiredOrders.rows) {
      const orderId = order.order_id;

      // 將上架項目狀態改回 Active（釋放票券）
      await client.query(
        `UPDATE listing_item li
         SET status = 'Active'
         FROM order_item oi
         WHERE oi.order_id = $1 
         AND oi.listing_id = li.listing_id 
         AND oi.ticket_id = li.ticket_id
         AND li.status = 'Sold'`,
        [orderId],
      );

      // 更新付款狀態為 Failed
      await client.query(
        `UPDATE payment SET status = 'Failed' WHERE order_id = $1`,
        [orderId],
      );

      // 更新訂單狀態為 Cancelled
      await client.query(
        `UPDATE "order" SET status = 'Cancelled' WHERE order_id = $1`,
        [orderId],
      );

      console.log(`[訂單超時檢查] 訂單 #${orderId} 已自動取消（超過 5 分鐘未付款）`);
    }

    await client.query('COMMIT');
    console.log(`[訂單超時檢查] 完成，共取消 ${expiredOrders.rows.length} 筆超時訂單`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[訂單超時檢查] 錯誤:', error);
  } finally {
    client.release();
  }
}

/**
 * 啟動訂單超時檢查服務
 * 每 1 分鐘檢查一次超時訂單
 */
export function startOrderTimeoutService(): void {
  console.log('[訂單超時服務] 已啟動，每 1 分鐘檢查一次超時訂單（5 分鐘未付款）');

  // 立即執行一次檢查
  cancelExpiredOrders().catch((error) => {
    console.error('[訂單超時服務] 初始檢查錯誤:', error);
  });

  // 每 1 分鐘執行一次檢查
  setInterval(() => {
    cancelExpiredOrders().catch((error) => {
      console.error('[訂單超時服務] 定時檢查錯誤:', error);
    });
  }, 60 * 1000); // 60 秒 = 1 分鐘
}

