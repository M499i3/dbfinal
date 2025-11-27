## Branch 1127 變更紀錄

### 📋 重點摘要
- ✅ 串接 Neon PostgreSQL 和 MongoDB Atlas 雲端資料庫
- ✅ 建立所有資料表（15 個表 + 18 個索引）
- ✅ 所有 API 已完整串接資料庫
- ✅ 移除 `node_modules` 追蹤，加入 `.gitignore`

---

### 🗄️ 資料庫串接

**PostgreSQL (Neon)**
- 配置檔案：`backend/src/config/database.ts`
- 支援連接字串：`NEON_DATABASE_URL`

**MongoDB Atlas**
- 配置檔案：`backend/src/config/mongodb.ts`
- 連接字串：`MONGODB_URI`

**環境變數**
- 複製 `backend/env.example` 為 `.env` 並填入連線資訊

---

### 📊 資料表

已建立 15 個資料表：
- `user`, `user_role` - 使用者與角色
- `venue`, `seat_zone`, `event` - 場館與活動
- `ticket`, `listing`, `listing_item` - 票券與上架
- `order`, `order_item`, `payment`, `transfer` - 訂單與付款
- `review`, `blacklist`, `risk_event` - 評價與風險管理

**建立方式：**
```bash
cd backend
npm run db:create-all-tables
```

---

### 🔌 API 串接狀態

所有 API 已串接資料庫：
- ✅ `/api/auth` - 註冊、登入、個人資料
- ✅ `/api/events` - 活動列表、詳情
- ✅ `/api/tickets` - 票券查詢、建立
- ✅ `/api/listings` - 上架管理
- ✅ `/api/orders` - 訂單、付款
- ✅ `/api/reviews` - 評價

---

### 🚀 組員操作步驟

1. **安裝依賴**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **設定環境變數**
   ```bash
   cd backend
   copy env.example .env  # Windows
   # 或 cp env.example .env  # Linux/Mac
   # 編輯 .env 填入資料庫連線資訊
   ```

3. **測試連線**
   ```bash
   cd backend
   npm run db:test
   ```

4. **建立資料表**
   ```bash
   npm run db:create-all-tables
   ```

5. **啟動伺服器**
   ```bash
   npm run dev
   ```

---

### 🛠️ 可用指令

- `npm run db:test` - 測試資料庫連線
- `npm run db:check` - 檢查環境變數
- `npm run db:create-all-tables` - 建立所有資料表

---

### 📌 注意事項

- `.env` 檔案不會被提交到 Git
- 資料庫連線資訊請妥善保管
- MongoDB Atlas 需設定 IP 白名單

---

> **Branch**: 1127 | **日期**: 2025-11-27


