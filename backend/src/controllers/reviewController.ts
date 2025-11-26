import { Response } from 'express';
import pool from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';

// 使用統一的 reviewee_id（根據助教評論修正）
export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { orderId, revieweeId, score, comment } = req.body;

  try {
    // 檢查訂單是否存在且已完成
    const orderCheck = await pool.query(
      `SELECT o.order_id, o.buyer_id, l.seller_id
       FROM "order" o
       JOIN order_item oi ON o.order_id = oi.order_id
       JOIN listing l ON oi.listing_id = l.listing_id
       WHERE o.order_id = $1 AND o.status = 'Completed'
       LIMIT 1`,
      [orderId]
    );

    if (orderCheck.rows.length === 0) {
      res.status(400).json({ error: '訂單不存在或尚未完成' });
      return;
    }

    const order = orderCheck.rows[0];

    // 檢查評價者是否為訂單的買家或賣家
    if (order.buyer_id !== userId && order.seller_id !== userId) {
      res.status(403).json({ error: '您無權評價此訂單' });
      return;
    }

    // 檢查被評價者是否為訂單的另一方
    if (revieweeId !== order.buyer_id && revieweeId !== order.seller_id) {
      res.status(400).json({ error: '被評價者必須是訂單的另一方' });
      return;
    }

    // 不能評價自己
    if (userId === revieweeId) {
      res.status(400).json({ error: '不能評價自己' });
      return;
    }

    // 檢查是否已經評價過
    const existingReview = await pool.query(
      `SELECT review_id FROM review 
       WHERE order_id = $1 AND reviewer_id = $2 AND reviewee_id = $3`,
      [orderId, userId, revieweeId]
    );

    if (existingReview.rows.length > 0) {
      res.status(400).json({ error: '您已經評價過此訂單' });
      return;
    }

    // 建立評價（使用統一的 reviewee_id）
    const result = await pool.query(
      `INSERT INTO review (order_id, reviewer_id, reviewee_id, score, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING review_id, created_at`,
      [orderId, userId, revieweeId, score, comment]
    );

    res.status(201).json({
      message: '評價成功',
      reviewId: result.rows[0].review_id,
      createdAt: result.rows[0].created_at,
    });
  } catch (error) {
    console.error('建立評價錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

export const getUserReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    // 獲取使用者收到的評價（使用統一的 reviewee_id）
    const result = await pool.query(
      `SELECT r.review_id, r.score, r.comment, r.created_at,
              u.user_id as reviewer_id, u.name as reviewer_name
       FROM review r
       JOIN "user" u ON r.reviewer_id = u.user_id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    // 計算平均評分
    const avgResult = await pool.query(
      `SELECT AVG(score) as avg_score, COUNT(*) as total_count
       FROM review WHERE reviewee_id = $1`,
      [userId]
    );

    res.json({
      averageScore: avgResult.rows[0].avg_score 
        ? parseFloat(avgResult.rows[0].avg_score).toFixed(1) 
        : null,
      totalCount: parseInt(avgResult.rows[0].total_count),
      reviews: result.rows.map((review) => ({
        reviewId: review.review_id,
        score: review.score,
        comment: review.comment,
        createdAt: review.created_at,
        reviewer: {
          userId: review.reviewer_id,
          name: review.reviewer_name,
        },
      })),
    });
  } catch (error) {
    console.error('獲取評價錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

