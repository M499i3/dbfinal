import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 載入環境變數（必須在導入配置檔案之前）
dotenv.config();

import router from './routes/index.js';
import { connectMongoDB, closeMongoDB } from './config/mongodb.js';
import { startOrderTimeoutService } from './services/orderTimeoutService.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(cors());
app.use(express.json());

// 請求日誌
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// API 路由
app.use('/api', router);

// 根路由
app.get('/', (_req, res) => {
  res.json({
    name: 'Encore API',
    version: '1.0.0',
    description: '二手票券交易平台 API',
    endpoints: {
      auth: '/api/auth',
      events: '/api/events',
      tickets: '/api/tickets',
      listings: '/api/listings',
      orders: '/api/orders',
      reviews: '/api/reviews',
    },
  });
});

// 404 處理
app.use((_req, res) => {
  res.status(404).json({ error: '找不到請求的資源' });
});

// 錯誤處理
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('伺服器錯誤:', err);
  res.status(500).json({ error: '伺服器內部錯誤' });
});

// 啟動伺服器並初始化資料庫連線
async function startServer() {
  try {
    // 初始化 MongoDB 連線
    await connectMongoDB();

    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🎫 Encore API Server                                   ║
║   二手票券交易平台後端服務                               ║
║                                                          ║
║   伺服器運行中: http://localhost:${PORT}                   ║
║   API 文件: http://localhost:${PORT}/api                   ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
      `);

      // 啟動訂單超時檢查服務
      startOrderTimeoutService();
    });
  } catch (error) {
    console.error('❌ 伺服器啟動失敗:', error);
    process.exit(1);
  }
}

// 優雅關閉
process.on('SIGINT', async () => {
  console.log('\n正在關閉伺服器...');
  await closeMongoDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n正在關閉伺服器...');
  await closeMongoDB();
  process.exit(0);
});

startServer();

export default app;

