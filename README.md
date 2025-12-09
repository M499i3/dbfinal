# Encore - 二手票券交易平台

資料庫管理（114-1）期末專案

## 📋 專案簡介

Encore 是一個二手演唱會票券交易流平台，將分散在各大社群媒體上的買賣需求集中起來，提供一個透明、便利且值得信賴的票券交易環境。

### 功能特色

- 🎫 **票券瀏覽與搜尋** - 依活動、藝人、場館、價格等條件篩選
- 📝 **票券上架** - 賣家可以輕鬆上架票券並設定價格
- 🛒 **購物車系統** - 支援多張票券同時購買
- 💳 **訂單管理** - 完整的下單、付款、票券轉移流程
- ⭐ **評價系統** - 交易完成後可互相評價
- 🔒 **安全機制** - 身分驗證、黑名單、風險監控

## 🗂️ 專案結構

```
dbfinal/
├── backend/           # 後端 API (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/    # 資料庫設定
│   │   ├── controllers/ # 控制器
│   │   ├── middleware/  # 中間件
│   │   ├── routes/    # 路由
│   │   └── app.ts     # 主程式
│   └── package.json
├── frontend/          # 前端 (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/ # 元件
│   │   ├── contexts/  # Context
│   │   ├── pages/     # 頁面
│   │   └── services/  # API 服務
│   └── package.json
├── database/          # 資料庫 Schema 和測試資料
│   ├── schema.sql     # 資料庫結構
│   └── seed.sql       # 測試資料
└── README.md
```

## 🛠️ 技術架構

### 後端
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT

### 前端
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Icons**: Lucide React

## 📊 資料庫設計

本系統共有 16 個資料表，根據助教評論進行以下修正：

1. **統一使用 `SEAT_ZONE`**（而非 SEATZONE）
2. **REVIEW 表中統一使用 `reviewee_id`**（而非 Reveiwee_id / Target_user_id）

### 資料表列表

| 表名 | 說明 |
|------|------|
| USER | 使用者基本資料 |
| USER_ROLE | 使用者角色（User/Admin） |
| VENUE | 場館資料 |
| SEAT_ZONE | 座位區域（統一命名） |
| EVENT | 活動資料 |
| TICKET | 票券資料 |
| LISTING | 上架刊登 |
| LISTING_ITEM | 上架項目 |
| ORDER | 訂單 |
| ORDER_ITEM | 訂單項目 |
| PAYMENT | 付款記錄 |
| TRANSFER | 票券轉移紀錄 |
| REVIEW | 評價（使用 reviewee_id） |
| CASE | 申訴案件 |
| BLACKLIST | 黑名單 |
| RISK_EVENT | 風險事件 |

## 🚀 快速開始

### 前置需求

- Node.js 18+
- PostgreSQL 14+
- npm 或 yarn

### 安裝步驟

1. **Clone 專案**
```bash
cd dbfinal
```

2. **建立資料庫**
```bash
# 連接到 PostgreSQL
psql -U postgres

# 建立資料庫
CREATE DATABASE encore;

# 執行 schema
\c encore
\i database/schema.sql
\i database/seed.sql
```

3. **設定後端環境變數**

在 `backend/` 目錄下建立 `.env` 文件：

```bash
cd backend

# 複製範例檔案
cp env.example .env
```

編輯 `.env` 文件，填入以下環境變數：
複製貼上即可

```env
# Neon PostgreSQL 連接字串
NEON_DATABASE_URL="postgresql://neondb_owner:npg_CS8q6JysjQlk@ep-morning-shadow-a1s59v7j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"


# MongoDB Atlas 連接字串
MONGODB_URI="mongodb+srv://594handsomeboy_db_user:ICUnPEX7NiJUOcVX@dbfinal.tcjttmn.mongodb.net/?appName=dbfinal"

```

4. **安裝後端依賴並啟動**
```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

5. **設定前端**
```bash
cd frontend

# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

6. **開啟瀏覽器**
```
前端: http://localhost:5173
後端 API: http://localhost:3000/api
```


## 📱 API 端點

### 認證
- `POST /api/auth/register` - 註冊
- `POST /api/auth/login` - 登入
- `GET /api/auth/profile` - 取得個人資料

### 活動
- `GET /api/events` - 取得所有活動
- `GET /api/events/:id` - 取得活動詳情

### 票券
- `GET /api/tickets` - 取得可購買票券
- `GET /api/tickets/my` - 取得我的票券
- `POST /api/tickets` - 建立票券

### 上架
- `POST /api/listings` - 建立上架
- `GET /api/listings/my` - 取得我的上架
- `DELETE /api/listings/:id` - 取消上架

### 訂單
- `POST /api/orders` - 建立訂單
- `GET /api/orders/my` - 取得我的訂單
- `POST /api/orders/:id/pay` - 付款
- `POST /api/orders/:id/cancel` - 取消訂單

### 評價
- `POST /api/reviews` - 建立評價
- `GET /api/users/:userId/reviews` - 取得使用者評價

## 👥 團隊成員

- B12705038 陳予婕
- B12705005 潘芊寧
- B11705055 黃天逸

## 📝 授權

此專案僅供學術用途。

---

© 2025 Encore - 資料庫管理期末專案
