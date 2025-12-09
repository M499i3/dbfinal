import { Response } from 'express';
import { connectMongoDB } from '../config/mongodb.js';
import { AuthRequest } from '../middleware/auth.js';

/**
 * 保存用戶搜索記錄（允許未登入用戶）
 */
export const saveSearchHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 嘗試從認證請求中獲取 userId，如果沒有則為 null
    const userId = req.user?.userId || null;
    const { searchTerm, pageType } = req.body;

    // 驗證必要欄位
    if (!searchTerm || typeof searchTerm !== 'string') {
      res.status(400).json({ error: '搜索關鍵字為必填欄位' });
      return;
    }

    // 如果用戶未登入，仍然記錄搜索（userId 為 null）
    const db = await connectMongoDB();
    const searchHistoryCollection = db.collection('search_history');

    const searchRecord = {
      userId: userId || null,
      searchTerm: searchTerm.trim(),
      pageType: pageType || 'unknown', // 記錄搜索發生的頁面類型
      createdAt: new Date(),
      ipAddress: req.ip || req.socket.remoteAddress || null,
      userAgent: req.get('user-agent') || null,
    };

    await searchHistoryCollection.insertOne(searchRecord);

    res.status(201).json({
      message: '搜索記錄已保存',
      searchId: searchRecord._id,
    });
  } catch (error) {
    console.error('保存搜索記錄錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

/**
 * 獲取用戶的搜索歷史（可選功能）
 */
export const getSearchHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: '需要登入才能查看搜索歷史' });
      return;
    }

    const db = await connectMongoDB();
    const searchHistoryCollection = db.collection('search_history');

    const limit = parseInt(req.query.limit as string) || 20;
    const pageType = req.query.pageType as string;

    const query: any = { userId };
    if (pageType) {
      query.pageType = pageType;
    }

    const searchHistory = await searchHistoryCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    res.json({
      searchHistory: searchHistory.map((record) => ({
        searchId: record._id,
        searchTerm: record.searchTerm,
        pageType: record.pageType,
        createdAt: record.createdAt,
      })),
    });
  } catch (error) {
    console.error('獲取搜索歷史錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

