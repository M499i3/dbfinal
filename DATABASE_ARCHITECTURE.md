# 資料庫架構說明

## 📊 資料庫概覽

您的系統使用 **兩個雲端資料庫** 來存儲所有數據：

### 1. **PostgreSQL (Neon)** - 主要資料庫
- **服務提供商**: Neon (https://neon.tech)
- **資料庫類型**: 關聯式資料庫 (RDBMS)
- **用途**: 存儲所有結構化的業務數據
- **連線方式**: 透過 SSL 加密連線到雲端

### 2. **MongoDB (Atlas)** - 輔助資料庫
- **服務提供商**: MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
- **資料庫類型**: NoSQL 文件資料庫
- **用途**: 目前配置完成但尚未實際使用（預留給未來擴展）
- **連線方式**: 透過 SSL 加密連線到雲端

---

## 🗄️ PostgreSQL (Neon) - 主要資料庫

### 存儲的資料表

您的系統在 PostgreSQL 中存儲了 **16 個資料表**：

#### 使用者相關
1. **`user`** - 使用者基本資料（姓名、電子郵件、電話、密碼、KYC 等級）
2. **`user_role`** - 使用者角色（User、BusinessOperator、Admin）

#### 場館與活動
3. **`venue`** - 場館資料（名稱、城市、地址）
4. **`seat_zone`** - 座位區域（每個場館的不同區域，如搖滾區、看台區）
5. **`event`** - 活動資料（藝人、標題、日期、時間、狀態、圖片 URL）

#### 票券與交易
6. **`ticket`** - 票券資料（座位標籤、面額、原始賣家、序號、擁有者）
7. **`listing`** - 上架記錄（賣家、建立時間、到期時間、狀態）
8. **`listing_item`** - 上架項目（每張票券的售價和狀態）
9. **`order`** - 訂單（買家、建立時間、狀態）
10. **`order_item`** - 訂單項目（訂單中的每張票券）
11. **`payment`** - 付款記錄（付款方式、金額、狀態、付款時間）
12. **`transfer`** - 票券轉移紀錄（從賣家轉移給買家的記錄）

#### 評價與安全
13. **`review`** - 評價（評分、評論、評價者和被評價者）
14. **`case`** - 申訴案件（申訴類型、狀態、處理記錄）
15. **`blacklist`** - 黑名單（被封鎖的使用者）
16. **`risk_event`** - 風險事件（系統記錄的異常行為）

### 資料存儲位置

✅ **所有資料都存儲在雲端 Neon PostgreSQL 資料庫中**

- **資料庫名稱**: `neondb`
- **連線字串**: 存儲在 `backend/.env` 檔案中的 `NEON_DATABASE_URL`
- **連線方式**: 
  ```
  postgresql://neondb_owner:npg_CS8q6JysjQlk@ep-morning-shadow-a1s59v7j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
  ```
- **區域**: 亞太地區（新加坡）AWS 伺服器

### 資料持久化

- ✅ 所有資料都會**自動保存**到雲端
- ✅ 資料會**持久化存儲**，不會因為應用程式重啟而消失
- ✅ Neon 提供**自動備份**功能
- ✅ 支援**多個連線**（使用連接池）

---

## 🍃 MongoDB (Atlas) - 輔助資料庫

### 目前狀態

- ✅ **已配置完成**：連線設定已建立
- ⚠️ **尚未實際使用**：目前系統中沒有使用 MongoDB 存儲數據
- 📝 **預留用途**：可能用於未來擴展（如日誌、分析數據等）

### 連線資訊

- **連線字串**: 存儲在 `backend/.env` 檔案中的 `MONGODB_URI`
- **資料庫名稱**: `encore`（預設）
- **連線方式**: 
  ```
  mongodb+srv://594handsomeboy_db_user:ICUnPEX7NiJUOcVX@dbfinal.tcjttmn.mongodb.net/?appName=dbfinal
  ```

---

## 🔄 資料流程

### 1. 資料寫入流程

```
用戶操作 (前端)
    ↓
API 請求 (後端 Express)
    ↓
資料庫操作 (PostgreSQL)
    ↓
雲端 Neon 資料庫
    ↓
資料持久化存儲
```

### 2. 資料讀取流程

```
用戶請求 (前端)
    ↓
API 請求 (後端 Express)
    ↓
查詢 PostgreSQL
    ↓
從雲端 Neon 讀取資料
    ↓
返回 JSON 給前端
    ↓
顯示在網頁上
```

### 3. 實際範例

**範例 1：用戶上架票券**
1. 用戶在「我的上架」頁面填寫票券資訊
2. 前端發送 `POST /api/tickets` 請求
3. 後端在 PostgreSQL 的 `ticket` 表創建記錄
4. 後端在 `listing` 和 `listing_item` 表創建上架記錄
5. 所有資料存儲在雲端 Neon 資料庫
6. 前端顯示「上架成功」

**範例 2：用戶瀏覽活動**
1. 用戶訪問「探索活動」頁面
2. 前端發送 `GET /api/events` 請求
3. 後端從 PostgreSQL 的 `event` 表讀取資料
4. 從雲端 Neon 資料庫獲取活動列表
5. 返回 JSON 資料給前端
6. 前端顯示活動列表

---

## 🔐 安全性

### SSL 加密連線

- ✅ **PostgreSQL**: 使用 SSL 加密連線（`sslmode=require`）
- ✅ **MongoDB**: 使用 SSL/TLS 加密連線（`mongodb+srv://`）

### 認證機制

- ✅ 使用環境變數存儲敏感資訊（`.env` 檔案）
- ✅ `.env` 檔案不應該提交到 Git（已在 `.gitignore` 中）
- ✅ 使用 JWT Token 進行用戶認證

---

## 📍 資料存儲位置總結

| 資料類型 | 存儲位置 | 服務提供商 | 狀態 |
|---------|---------|-----------|------|
| 使用者資料 | PostgreSQL (Neon) | Neon | ✅ 使用中 |
| 活動資料 | PostgreSQL (Neon) | Neon | ✅ 使用中 |
| 票券資料 | PostgreSQL (Neon) | Neon | ✅ 使用中 |
| 訂單資料 | PostgreSQL (Neon) | Neon | ✅ 使用中 |
| 上架記錄 | PostgreSQL (Neon) | Neon | ✅ 使用中 |
| 評價資料 | PostgreSQL (Neon) | Neon | ✅ 使用中 |
| 其他業務數據 | PostgreSQL (Neon) | Neon | ✅ 使用中 |
| MongoDB 數據 | MongoDB Atlas | MongoDB | ⚠️ 已配置但未使用 |

---

## 🌐 雲端服務優勢

### Neon PostgreSQL 優勢
- ✅ **自動備份**：定期自動備份資料
- ✅ **高可用性**：99.9% 正常運行時間
- ✅ **全球存取**：可從任何地方連線
- ✅ **自動擴展**：根據使用量自動調整
- ✅ **免費方案**：提供免費額度

### MongoDB Atlas 優勢
- ✅ **雲端管理**：無需自行管理伺服器
- ✅ **自動擴展**：根據需求自動調整
- ✅ **全球分佈**：支援多區域部署

---

## 🔍 如何查看資料

### 方式 1：透過 API
```bash
# 查看所有活動
curl http://localhost:3000/api/events

# 查看我的票券（需要登入）
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/tickets/my
```

### 方式 2：透過 Neon Console
1. 登入 Neon Console (https://console.neon.tech)
2. 選擇您的專案
3. 使用 SQL Editor 查詢資料
   ```sql
   SELECT * FROM event;
   SELECT * FROM ticket;
   SELECT * FROM "user";
   ```

### 方式 3：透過後端腳本
```bash
cd backend
npm run db:test  # 測試連線
```

---

## 📝 重要注意事項

1. **所有資料都在雲端**：不需要本地資料庫，所有數據都存儲在 Neon 和 MongoDB Atlas
2. **資料持久化**：資料會永久保存，除非手動刪除
3. **自動備份**：Neon 會自動備份您的資料
4. **連線安全**：所有連線都使用 SSL 加密
5. **環境變數**：敏感資訊（如密碼）存儲在 `.env` 檔案中，不應該提交到 Git

---

## 🚀 總結

您的系統是一個**完全雲端化的應用程式**：

- ✅ **前端**：運行在本地開發伺服器（`localhost:5173`）
- ✅ **後端**：運行在本地開發伺服器（`localhost:3000`）
- ✅ **資料庫**：完全存儲在雲端（Neon PostgreSQL + MongoDB Atlas）

這意味著：
- 您可以從任何地方存取資料
- 資料會自動備份
- 不需要管理資料庫伺服器
- 可以輕鬆擴展和部署

