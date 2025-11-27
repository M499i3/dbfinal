# 資料庫設定說明

本專案使用兩個雲端資料庫：
- **Neon (PostgreSQL)** - 用於關聯式資料儲存
- **MongoDB** - 用於 NoSQL 資料儲存

## 📋 設定步驟

### 1. 安裝依賴套件

```bash
cd backend
npm install
```

### 2. 設定環境變數

複製環境變數範本檔案：

```bash
# Windows
copy env.example .env

# Linux/Mac
cp env.example .env
```

### 3. 填入資料庫連線資訊

編輯 `backend/.env` 檔案，填入以下資訊：

#### Neon PostgreSQL 設定

**方式一：使用連接字串（推薦）**

從 Neon Console 取得連接字串，格式如下：
```
postgresql://username:password@hostname/database?sslmode=require
```

填入到 `.env`：
```env
NEON_DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
```

**方式二：使用個別參數**

如果沒有連接字串，可以使用個別參數：
```env
DB_HOST=your-neon-host
DB_PORT=5432
DB_NAME=encore
DB_USER=your-username
DB_PASSWORD=your-password
```

#### MongoDB 設定

**MongoDB Atlas（雲端）**

從 MongoDB Atlas 取得連接字串：
```
mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

填入到 `.env`：
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=encore
```

**本地 MongoDB**

如果使用本地 MongoDB：
```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=encore
```

### 4. 測試連線

執行測試腳本確認連線是否正常：

```bash
npm run db:test
```

如果看到以下訊息，表示連線成功：
```
✅ PostgreSQL (Neon) 連線成功！
✅ MongoDB 連線成功！
🎉 所有資料庫連線測試通過！
```

## 🔧 使用方式

### 在程式碼中使用 PostgreSQL

```typescript
import pool from './config/database.js';

// 執行查詢
const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);
```

### 在程式碼中使用 MongoDB

```typescript
import { getMongoDB } from './config/mongodb.js';

// 取得資料庫實例
const db = getMongoDB();
if (db) {
  const collection = db.collection('your_collection');
  const result = await collection.find({}).toArray();
}
```

## ⚠️ 注意事項

1. **環境變數安全**：`.env` 檔案已加入 `.gitignore`，不會被提交到 Git
2. **連線字串格式**：Neon 和 MongoDB Atlas 都需要 SSL 連線，請確保連接字串包含 SSL 設定
3. **資料庫初始化**：首次使用時，請先執行 `database/schema.sql` 來建立 PostgreSQL 的資料表結構

## 🐛 疑難排解

### PostgreSQL 連線失敗

- 檢查 `NEON_DATABASE_URL` 或個別參數是否正確
- 確認 Neon 專案的連線設定允許外部連線
- 檢查防火牆設定

### MongoDB 連線失敗

- 檢查 `MONGODB_URI` 是否正確
- 如果是 MongoDB Atlas，確認 IP 白名單設定
- 確認使用者名稱和密碼正確

### 找不到模組錯誤

如果出現 `Cannot find module` 錯誤，請確認已安裝所有依賴：
```bash
npm install
```

