import { Response } from 'express';
import pool from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { items } = req.body; // [{ listingId, ticketId }]

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 驗證所有項目是否可購買
    for (const item of items) {
      const availableCheck = await client.query(
        `SELECT li.listing_id, li.ticket_id, li.price, l.seller_id
         FROM listing_item li
         JOIN listing l ON li.listing_id = l.listing_id
         WHERE li.listing_id = $1 AND li.ticket_id = $2 
         AND li.status = 'Active' 
         AND l.status = 'Active' 
         AND l.approval_status = 'Approved'
         FOR UPDATE`,
        [item.listingId, item.ticketId]
      );

      if (availableCheck.rows.length === 0) {
        res.status(400).json({ error: `票券 ${item.ticketId} 已售出或不可購買` });
        await client.query('ROLLBACK');
        return;
      }

      // 不能購買自己的票
      if (availableCheck.rows[0].seller_id === userId) {
        res.status(400).json({ error: '不能購買自己上架的票券' });
        await client.query('ROLLBACK');
        return;
      }
    }

    // 建立訂單
    const orderResult = await client.query(
      `INSERT INTO "order" (buyer_id, status) 
       VALUES ($1, 'Pending') 
       RETURNING order_id, created_at`,
      [userId]
    );

    const orderId = orderResult.rows[0].order_id;
    let totalAmount = 0;

    // 建立訂單項目並更新上架狀態
    for (const item of items) {
      const priceResult = await client.query(
        `SELECT price FROM listing_item WHERE listing_id = $1 AND ticket_id = $2`,
        [item.listingId, item.ticketId]
      );

      const price = parseFloat(priceResult.rows[0].price);
      totalAmount += price;

      await client.query(
        `INSERT INTO order_item (order_id, listing_id, ticket_id, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.listingId, item.ticketId, price]
      );

      // 標記為已售出
      await client.query(
        `UPDATE listing_item SET status = 'Sold' WHERE listing_id = $1 AND ticket_id = $2`,
        [item.listingId, item.ticketId]
      );
    }

    // 建立付款記錄
    await client.query(
      `INSERT INTO payment (order_id, method, amount, status) VALUES ($1, 'CreditCard', $2, 'Pending')`,
      [orderId, totalAmount]
    );

    await client.query('COMMIT');

    // 处理时间格式，确保返回 UTC 时间的 ISO 8601 字符串
    let createdAt = orderResult.rows[0].created_at;
    if (createdAt instanceof Date) {
      createdAt = createdAt.toISOString();
    } else if (typeof createdAt === 'string') {
      // 如果已经是字符串，确保是 ISO 8601 格式
      // 如果字符串没有时区信息，假设是 UTC
      if (!createdAt.endsWith('Z') && !createdAt.includes('+') && !createdAt.includes('-', 10)) {
        // 没有时区信息，添加 Z 表示 UTC
        createdAt = createdAt + 'Z';
      }
    } else {
      createdAt = new Date(createdAt).toISOString();
    }
    
    res.status(201).json({
      message: '訂單建立成功，請在 5 分鐘內完成付款',
      orderId,
      totalAmount,
      createdAt,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('建立訂單錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  } finally {
    client.release();
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  try {
    const result = await pool.query(
      `SELECT o.order_id, 
              o.created_at, 
              o.status,
              (SELECT payment_id FROM payment WHERE order_id = o.order_id LIMIT 1) as payment_id,
              (SELECT method FROM payment WHERE order_id = o.order_id LIMIT 1) as method,
              (SELECT amount FROM payment WHERE order_id = o.order_id LIMIT 1) as amount,
              (SELECT paid_at FROM payment WHERE order_id = o.order_id LIMIT 1) as paid_at,
              (SELECT status FROM payment WHERE order_id = o.order_id LIMIT 1) as payment_status,
              json_agg(json_build_object(
                'ticketId', t.ticket_id,
                'seatLabel', t.seat_label,
                'unitPrice', oi.unit_price,
                'eventTitle', e.title,
                'artist', e.artist,
                'eventDate', e.event_date,
                'zoneName', sz.name,
                'sellerId', u.user_id,
                'sellerName', u.name
              )) as items,
              (SELECT COUNT(*) > 0 FROM review WHERE order_id = o.order_id AND reviewer_id = $1) as has_reviewed,
              (SELECT COUNT(*) > 0 FROM "case" WHERE order_id = o.order_id AND reporter_id = $1) as has_case
       FROM "order" o
       JOIN order_item oi ON o.order_id = oi.order_id
       JOIN ticket t ON oi.ticket_id = t.ticket_id
       JOIN event e ON t.event_id = e.event_id
       JOIN seat_zone sz ON t.zone_id = sz.zone_id
       JOIN listing l ON oi.listing_id = l.listing_id
       JOIN "user" u ON l.seller_id = u.user_id
       WHERE o.buyer_id = $1
       GROUP BY o.order_id, o.created_at, o.status
       ORDER BY o.created_at DESC`,
      [userId]
    );

    res.json({
      orders: result.rows.map((order) => {
        // 处理时间格式，确保返回 UTC 时间的 ISO 8601 字符串
        let createdAt = order.created_at;
        if (createdAt instanceof Date) {
          createdAt = createdAt.toISOString();
        } else if (typeof createdAt === 'string') {
          // 如果已经是字符串，确保是 ISO 8601 格式
          // 如果字符串没有时区信息，假设是 UTC
          if (!createdAt.endsWith('Z') && !createdAt.includes('+') && !createdAt.includes('-', 10)) {
            // 没有时区信息，添加 Z 表示 UTC
            createdAt = createdAt + 'Z';
          }
        } else {
          createdAt = new Date(createdAt).toISOString();
        }
        
        return {
          orderId: order.order_id,
          createdAt,
          status: order.status,
          hasReviewed: order.has_reviewed || false,
          hasCase: order.has_case || false,
          payment: {
            paymentId: order.payment_id,
            method: order.method,
            amount: order.amount ? parseFloat(order.amount) : null,
            paidAt: order.paid_at,
            status: order.payment_status,
          },
          items: order.items,
        };
      }),
    });
  } catch (error) {
    console.error('獲取訂單錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

export const payOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { id } = req.params;
  const { method } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 檢查訂單是否屬於當前使用者且未付款
    const orderCheck = await client.query(
      `SELECT o.order_id, p.payment_id, p.amount
       FROM "order" o
       JOIN payment p ON o.order_id = p.order_id
       WHERE o.order_id = $1 AND o.buyer_id = $2 AND o.status = 'Pending' AND p.status = 'Pending'
       FOR UPDATE`,
      [id, userId]
    );

    if (orderCheck.rows.length === 0) {
      res.status(404).json({ error: '訂單不存在或已付款' });
      await client.query('ROLLBACK');
      return;
    }

    const paymentId = orderCheck.rows[0].payment_id;

    // 更新付款狀態
    await client.query(
      `UPDATE payment SET method = $1, paid_at = CURRENT_TIMESTAMP, status = 'Success' WHERE payment_id = $2`,
      [method || 'CreditCard', paymentId]
    );

    // 更新訂單狀態
    await client.query(
      `UPDATE "order" SET status = 'Paid' WHERE order_id = $1`,
      [id]
    );

    // 獲取訂單中的票券並進行轉移
    const orderItems = await client.query(
      `SELECT oi.ticket_id, l.seller_id
       FROM order_item oi
       JOIN listing l ON oi.listing_id = l.listing_id
       WHERE oi.order_id = $1`,
      [id]
    );

    for (const item of orderItems.rows) {
      // 建立轉移記錄
      await client.query(
        `INSERT INTO transfer (ticket_id, from_user_id, to_user_id, order_id, result)
         VALUES ($1, $2, $3, $4, 'Success')`,
        [item.ticket_id, item.seller_id, userId, id]
      );

      // 更新票券擁有者
      await client.query(
        `UPDATE ticket SET owner_id = $1, status = 'Transferred' WHERE ticket_id = $2`,
        [userId, item.ticket_id]
      );
    }

    // 更新訂單狀態為已完成
    await client.query(
      `UPDATE "order" SET status = 'Completed' WHERE order_id = $1`,
      [id]
    );

    await client.query('COMMIT');

    res.json({
      message: '付款成功，票券已轉移至您的帳戶',
      orderId: parseInt(id),
      paidAt: new Date().toISOString(),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('付款錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  } finally {
    client.release();
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { id } = req.params;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 檢查訂單是否屬於當前使用者且未付款
    const orderCheck = await client.query(
      `SELECT order_id FROM "order" WHERE order_id = $1 AND buyer_id = $2 AND status = 'Pending'`,
      [id, userId]
    );

    if (orderCheck.rows.length === 0) {
      res.status(404).json({ error: '訂單不存在或無法取消' });
      await client.query('ROLLBACK');
      return;
    }

    // 將上架項目狀態改回 Active
    await client.query(
      `UPDATE listing_item li
       SET status = 'Active'
       FROM order_item oi
       WHERE oi.order_id = $1 AND oi.listing_id = li.listing_id AND oi.ticket_id = li.ticket_id`,
      [id]
    );

    // 更新付款狀態
    await client.query(
      `UPDATE payment SET status = 'Failed' WHERE order_id = $1`,
      [id]
    );

    // 更新訂單狀態
    await client.query(
      `UPDATE "order" SET status = 'Cancelled' WHERE order_id = $1`,
      [id]
    );

    await client.query('COMMIT');

    res.json({ message: '訂單已取消' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('取消訂單錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  } finally {
    client.release();
  }
};

