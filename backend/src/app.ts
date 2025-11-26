import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/index.js';

// 載入環境變數
dotenv.config();

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

// 啟動伺服器
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
});

export default app;

