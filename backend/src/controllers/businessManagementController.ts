import { Response } from 'express';
import pool from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';

// ==================== 票券與刊登管理 ====================

// 獲取所有上架（供審核和管理）
export const getAllListings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, sellerId, approvalStatus } = req.query;

    let query = `
      SELECT l.listing_id, l.seller_id, l.created_at, l.expires_at, l.status, l.approval_status,
             u.name as seller_name, u.email as seller_email,
             COUNT(li.ticket_id) as ticket_count,
             SUM(li.price) as total_price
      FROM listing l
      JOIN "user" u ON l.seller_id = u.user_id
      LEFT JOIN listing_item li ON l.listing_id = li.listing_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND l.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (sellerId) {
      query += ` AND l.seller_id = $${paramIndex}`;
      params.push(sellerId);
      paramIndex++;
    }

    if (approvalStatus) {
      query += ` AND l.approval_status = $${paramIndex}`;
      params.push(approvalStatus);
      paramIndex++;
    }

    query += ` GROUP BY l.listing_id, u.name, u.email ORDER BY l.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({ listings: result.rows });
  } catch (error) {
    console.error('獲取上架列表錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// 獲取上架詳情（包含票券資訊）
export const getListingDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const listingResult = await pool.query(
      `SELECT l.*, u.name as seller_name, u.email as seller_email
       FROM listing l
       JOIN "user" u ON l.seller_id = u.user_id
       WHERE l.listing_id = $1`,
      [id]
    );

    if (listingResult.rows.length === 0) {
      res.status(404).json({ error: '上架不存在' });
      return;
    }

    const itemsResult = await pool.query(
      `SELECT li.*, t.ticket_id, t.seat_label, t.face_value, t.serial_no,
              e.title as event_title, e.artist, e.event_date,
              sz.name as zone_name
       FROM listing_item li
       JOIN ticket t ON li.ticket_id = t.ticket_id
       JOIN event e ON t.event_id = e.event_id
       JOIN seat_zone sz ON t.zone_id = sz.zone_id
       WHERE li.listing_id = $1`,
      [id]
    );

    res.json({
      listing: listingResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error('獲取上架詳情錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// 審核上架（通過或拒絕）
export const approveListing = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { action } = req.body; // 'approve' 或 'reject'

  try {
    if (action !== 'approve' && action !== 'reject') {
      res.status(400).json({ error: '無效的操作，必須是 approve 或 reject' });
      return;
    }

    const approvalStatus = action === 'approve' ? 'Approved' : 'Rejected';

    await pool.query(
      `UPDATE listing SET approval_status = $1 WHERE listing_id = $2`,
      [approvalStatus, id]
    );

    res.json({ 
      message: action === 'approve' ? '上架已審核通過' : '上架已拒絕',
      approvalStatus 
    });
  } catch (error) {
    console.error('審核上架錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// 下架違規票券（移到管理票券功能中）
export const takeDownListing = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    await pool.query('BEGIN');

    // 更新上架狀態
    await pool.query(
      `UPDATE listing SET status = 'Cancelled' WHERE listing_id = $1`,
      [id]
    );

    // 更新上架項目狀態
    await pool.query(
      `UPDATE listing_item SET status = 'Cancelled' WHERE listing_id = $1`,
      [id]
    );

    // 記錄風險事件
    const listingResult = await pool.query(
      'SELECT seller_id FROM listing WHERE listing_id = $1',
      [id]
    );

    if (listingResult.rows.length > 0) {
      await pool.query(
        `INSERT INTO risk_event (user_id, type, level, ref_id)
         VALUES ($1, 'Fraud', 3, $2)`,
        [listingResult.rows[0].seller_id, id]
      );
    }

    await pool.query('COMMIT');

    res.json({ message: '上架已下架' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('下架上架錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// ==================== 用戶與風險管理 ====================

// 獲取所有使用者
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, kycLevel } = req.query;

    let query = `
      SELECT u.*, 
             array_agg(ur.role) as roles,
             (SELECT COUNT(*) FROM blacklist WHERE user_id = u.user_id) > 0 as is_blacklisted,
             (SELECT COUNT(*) FROM risk_event WHERE user_id = u.user_id) as risk_event_count
      FROM "user" u
      LEFT JOIN user_role ur ON u.user_id = ur.user_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (kycLevel !== undefined) {
      query += ` AND u.kyc_level = $${paramIndex}`;
      params.push(kycLevel);
      paramIndex++;
    }

    query += ` GROUP BY u.user_id ORDER BY u.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      users: result.rows.map((u) => ({
        userId: u.user_id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        kycLevel: u.kyc_level,
        createdAt: u.created_at,
        roles: u.roles || [],
        isBlacklisted: u.is_blacklisted || false,
        riskEventCount: parseInt(u.risk_event_count) || 0,
      })),
    });
  } catch (error) {
    console.error('獲取使用者列表錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// 獲取使用者詳情與交易紀錄
export const getUserDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    // 使用者基本資料
    const userResult = await pool.query(
      `SELECT u.*, array_agg(ur.role) as roles
       FROM "user" u
       LEFT JOIN user_role ur ON u.user_id = ur.user_id
       WHERE u.user_id = $1
       GROUP BY u.user_id`,
      [id]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: '使用者不存在' });
      return;
    }

    // 交易紀錄
    const ordersResult = await pool.query(
      `SELECT o.*, COUNT(oi.ticket_id) as item_count, SUM(oi.unit_price) as total_amount
       FROM "order" o
       LEFT JOIN order_item oi ON o.order_id = oi.order_id
       WHERE o.buyer_id = $1 OR EXISTS (
         SELECT 1 FROM listing l
         JOIN listing_item li ON l.listing_id = li.listing_id
         JOIN order_item oi2 ON li.listing_id = oi2.listing_id AND li.ticket_id = oi2.ticket_id
         WHERE l.seller_id = $1 AND oi2.order_id = o.order_id
       )
       GROUP BY o.order_id
       ORDER BY o.created_at DESC
       LIMIT 50`,
      [id]
    );

    // 上架紀錄
    const listingsResult = await pool.query(
      `SELECT l.*, COUNT(li.ticket_id) as ticket_count
       FROM listing l
       LEFT JOIN listing_item li ON l.listing_id = li.listing_id
       WHERE l.seller_id = $1
       GROUP BY l.listing_id
       ORDER BY l.created_at DESC
       LIMIT 50`,
      [id]
    );

    // 風險事件
    const riskEventsResult = await pool.query(
      `SELECT * FROM risk_event WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [id]
    );

    // 黑名單狀態
    const blacklistResult = await pool.query(
      'SELECT * FROM blacklist WHERE user_id = $1',
      [id]
    );

    res.json({
      user: userResult.rows[0],
      orders: ordersResult.rows,
      listings: listingsResult.rows,
      riskEvents: riskEventsResult.rows,
      blacklist: blacklistResult.rows[0] || null,
    });
  } catch (error) {
    console.error('獲取使用者詳情錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// 加入黑名單
export const addToBlacklist = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { reason } = req.body;

  try {
    await pool.query(
      `INSERT INTO blacklist (user_id, reason)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET reason = $2`,
      [userId, reason]
    );

    // 記錄風險事件
    // 注意：加入黑名單時，ref_id 使用 user_id 作為參考
    await pool.query(
      `INSERT INTO risk_event (user_id, type, level, ref_id)
       VALUES ($1, 'Fraud', 5, $1)`,
      [userId]
    );

    res.json({ message: '使用者已加入黑名單' });
  } catch (error) {
    console.error('加入黑名單錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// 移除黑名單
export const removeFromBlacklist = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    await pool.query('DELETE FROM blacklist WHERE user_id = $1', [userId]);

    res.json({ message: '使用者已從黑名單移除' });
  } catch (error) {
    console.error('移除黑名單錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// 建立風險事件
export const createRiskEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId, type, level, refId } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO risk_event (user_id, type, level, ref_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, type, level || 3, refId]
    );

    res.status(201).json({
      message: '風險事件已建立',
      riskEvent: result.rows[0],
    });
  } catch (error) {
    console.error('建立風險事件錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// ==================== 交易與付款監控 ====================

// 獲取所有訂單
export const getAllOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, buyerId, startDate, endDate } = req.query;

    let query = `
      SELECT o.*, 
             u.name as buyer_name, u.email as buyer_email,
             COUNT(oi.ticket_id) as item_count,
             SUM(oi.unit_price) as total_amount,
             p.status as payment_status, p.method as payment_method
      FROM "order" o
      JOIN "user" u ON o.buyer_id = u.user_id
      LEFT JOIN order_item oi ON o.order_id = oi.order_id
      LEFT JOIN payment p ON o.order_id = p.order_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (buyerId) {
      query += ` AND o.buyer_id = $${paramIndex}`;
      params.push(buyerId);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND o.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND o.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` GROUP BY o.order_id, u.name, u.email, p.status, p.method ORDER BY o.created_at DESC LIMIT 100`;

    const result = await pool.query(query, params);

    res.json({
      orders: result.rows.map((o) => ({
        orderId: o.order_id,
        buyerId: o.buyer_id,
        buyerName: o.buyer_name,
        createdAt: o.created_at,
        status: o.status,
        totalAmount: parseFloat(o.total_amount || '0'),
        paymentStatus: o.payment_status || 'Pending',
      })),
    });
  } catch (error) {
    console.error('獲取訂單列表錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// 獲取訂單詳情
export const getOrderDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const orderResult = await pool.query(
      `SELECT o.*, u.name as buyer_name, u.email as buyer_email
       FROM "order" o
       JOIN "user" u ON o.buyer_id = u.user_id
       WHERE o.order_id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      res.status(404).json({ error: '訂單不存在' });
      return;
    }

    const itemsResult = await pool.query(
      `SELECT oi.*, t.seat_label, e.title as event_title, e.artist,
              l.seller_id, u2.name as seller_name
       FROM order_item oi
       JOIN ticket t ON oi.ticket_id = t.ticket_id
       JOIN event e ON t.event_id = e.event_id
       JOIN listing_item li ON oi.listing_id = li.listing_id AND oi.ticket_id = li.ticket_id
       JOIN listing l ON li.listing_id = l.listing_id
       JOIN "user" u2 ON l.seller_id = u2.user_id
       WHERE oi.order_id = $1`,
      [id]
    );

    const paymentResult = await pool.query(
      'SELECT * FROM payment WHERE order_id = $1',
      [id]
    );

    const transferResult = await pool.query(
      `SELECT t.*, u1.name as from_name, u2.name as to_name
       FROM transfer t
       JOIN "user" u1 ON t.from_user_id = u1.user_id
       JOIN "user" u2 ON t.to_user_id = u2.user_id
       WHERE t.order_id = $1`,
      [id]
    );

    res.json({
      order: orderResult.rows[0],
      items: itemsResult.rows,
      payment: paymentResult.rows[0] || null,
      transfers: transferResult.rows,
    });
  } catch (error) {
    console.error('獲取訂單詳情錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// 獲取交易統計報表
export const getTransactionStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = startDate && endDate
      ? `WHERE o.created_at >= '${startDate}' AND o.created_at <= '${endDate}'`
      : '';

    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.order_id) as total_orders,
        COUNT(DISTINCT o.buyer_id) as unique_buyers,
        SUM(CASE WHEN o.status = 'Completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN o.status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(CASE WHEN p.status = 'Success' THEN p.amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN p.status = 'Failed' THEN p.amount ELSE 0 END) as failed_payments,
        AVG(CASE WHEN p.status = 'Success' THEN p.amount ELSE NULL END) as avg_order_value
      FROM "order" o
      LEFT JOIN payment p ON o.order_id = p.order_id
      ${dateFilter}
    `);

    const refundStatsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_refunds,
        SUM(p.amount) as total_refund_amount
      FROM payment p
      JOIN "order" o ON p.order_id = o.order_id
      WHERE p.status = 'Failed' AND o.status = 'Cancelled'
      ${dateFilter.replace('o.created_at', 'p.paid_at')}
    `);

    res.json({
      stats: statsResult.rows[0],
      refundStats: refundStatsResult.rows[0],
    });
  } catch (error) {
    console.error('獲取交易統計錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// ==================== 申訴案件管理 ====================

// 建立申訴案件（用戶端）
export const createCase = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { orderId, type } = req.body;

  try {
    // 驗證類型
    const validTypes = ['Fraud', 'Delivery', 'Refund', 'Other'];
    if (!type || !validTypes.includes(type)) {
      res.status(400).json({ error: '案件類型必須為：Fraud, Delivery, Refund, Other' });
      return;
    }

    // 檢查訂單是否存在且屬於當前使用者
    const orderCheck = await pool.query(
      `SELECT order_id, buyer_id, status
       FROM "order"
       WHERE order_id = $1`,
      [orderId]
    );

    if (orderCheck.rows.length === 0) {
      res.status(404).json({ error: '訂單不存在' });
      return;
    }

    const order = orderCheck.rows[0];

    // 檢查訂單是否屬於當前使用者（買家可以提出申訴）
    if (order.buyer_id !== userId) {
      res.status(403).json({ error: '只能對自己的訂單提出申訴' });
      return;
    }

    // 檢查是否已經對此訂單提出過申訴
    const existingCase = await pool.query(
      `SELECT case_id FROM "case" WHERE order_id = $1 AND reporter_id = $2`,
      [orderId, userId]
    );

    if (existingCase.rows.length > 0) {
      res.status(400).json({ error: '您已經對此訂單提出過申訴' });
      return;
    }

    // 建立申訴案件
    const result = await pool.query(
      `INSERT INTO "case" (order_id, reporter_id, type, status)
       VALUES ($1, $2, $3, 'Open')
       RETURNING case_id, opened_at`,
      [orderId, userId, type]
    );

    res.status(201).json({
      message: '申訴案件已建立',
      caseId: result.rows[0].case_id,
      openedAt: result.rows[0].opened_at,
    });
  } catch (error) {
    console.error('建立申訴案件錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// 獲取所有申訴案件
export const getAllCases = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, type } = req.query;

    let query = `
      SELECT c.*, 
             u1.name as reporter_name, u1.email as reporter_email,
             o.order_id, o.status as order_status,
             o.buyer_id, u2.name as buyer_name
      FROM "case" c
      JOIN "user" u1 ON c.reporter_id = u1.user_id
      JOIN "order" o ON c.order_id = o.order_id
      LEFT JOIN "user" u2 ON o.buyer_id = u2.user_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (type) {
      query += ` AND c.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    query += ` ORDER BY c.opened_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      cases: result.rows.map((c) => ({
        caseId: c.case_id,
        orderId: c.order_id,
        complainantId: c.reporter_id,
        complainantName: c.reporter_name,
        respondentId: c.buyer_id || null,
        respondentName: c.buyer_name || '未知',
        type: c.type,
        description: c.description || '',
        status: c.status,
        createdAt: c.opened_at,
      })),
    });
  } catch (error) {
    console.error('獲取申訴案件錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// 更新申訴案件狀態
export const updateCaseStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updateData: any[] = [status];
    let query = `UPDATE "case" SET status = $1`;

    if (status === 'Closed') {
      query += `, closed_at = CURRENT_TIMESTAMP`;
    } else {
      query += `, closed_at = NULL`;
    }

    query += ` WHERE case_id = $2 RETURNING *`;
    updateData.push(id);

    const result = await pool.query(query, updateData);

    if (result.rows.length === 0) {
      res.status(404).json({ error: '申訴案件不存在' });
      return;
    }

    res.json({
      message: '申訴案件狀態已更新',
      case: result.rows[0],
    });
  } catch (error) {
    console.error('更新申訴案件錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// ==================== 系統紀錄查詢 ====================

// 獲取系統活動紀錄
export const getSystemLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, userId, startDate, endDate, limit = 100 } = req.query;

    // 這裡可以整合多種系統紀錄
    // 目前先返回風險事件作為範例
    let query = `
      SELECT 
        risk_id as log_id,
        'RiskEvent' as log_type,
        user_id,
        type as action_type,
        level,
        created_at,
        ref_id
      FROM risk_event
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (userId) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);

    // 獲取使用者名稱
    const logsWithUsers = await Promise.all(
      result.rows.map(async (log) => {
        const userResult = await pool.query(
          'SELECT name FROM "user" WHERE user_id = $1',
          [log.user_id]
        );
        return {
          logId: log.log_id,
          action: log.action_type || log.log_type,
          userId: log.user_id,
          userName: userResult.rows[0]?.name || '未知使用者',
          details: `風險等級: ${log.level}, 參考ID: ${log.ref_id || 'N/A'}`,
          createdAt: log.created_at,
        };
      })
    );

    res.json({ logs: logsWithUsers });
  } catch (error) {
    console.error('獲取系統紀錄錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

