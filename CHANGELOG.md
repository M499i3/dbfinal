# 更新記錄

## 2025-01-XX - 資料庫 Schema 修正與功能新增

### 📊 資料庫 Schema 修正

#### CASE 表建立
- ✅ 建立 CASE 申訴案件資料表
- ✅ 欄位：case_id, order_id, reporter_id, type, status, opened_at, closed_at
- ✅ 外鍵約束：ON DELETE CASCADE, ON UPDATE CASCADE
- ✅ 建立相關索引

#### RISK_EVENT 表修正
- ✅ 將 `ref_id` 欄位改為 NOT NULL
- ✅ 更新現有資料（NULL 值處理）
- ✅ 所有 INSERT 語句已更新，確保包含 ref_id

### 🎫 票券瀏覽功能優化

#### 過期票券篩選
- ✅ 瀏覽票券頁面：自動過濾已結束的演唱會票券
- ✅ 賣家資訊頁面：不顯示已過期的票券
- ✅ 上架票券時：只能選擇未結束的活動

#### 日期顯示優化
- ✅ 瀏覽票券頁面：日期顯示加上年份

### ⭐ 評價系統

#### 功能實現
- ✅ 完成付款後可對訂單進行評價
- ✅ 一個訂單只能評價一次
- ✅ 評分範圍：1-5 分
- ✅ 可選評論（最多 200 字）
- ✅ 在「我的訂單」頁面顯示評價功能

### 📝 申訴案件系統

#### 功能實現
- ✅ 完成付款後可對訂單提出申訴
- ✅ 一個訂單只能提出一個申訴
- ✅ 申訴類型：Fraud, Delivery, Refund, Other
- ✅ 在「我的訂單」頁面顯示申訴功能

### 🔒 上架管理優化

#### 售出票券保護
- ✅ 已售出的票券無法取消上架
- ✅ 防止賣家誤操作影響已完成交易

#### 價格驗證
- ✅ 上架票券時驗證金額必須為正整數
- ✅ 前端和後端雙重驗證

### 🗂️ 檔案整理

#### 刪除的檔案
- ❌ `backend/DATABASE_SETUP.md` - 教學文件
- ❌ `backend/SCRAPING_README.md` - 教學文件
- ❌ `backend/SCRAPING_TRUTH.md` - 教學文件
- ❌ `DATA_STORAGE.md` - 教學文件
- ❌ `DATABASE_ARCHITECTURE.md` - 教學文件
- ❌ `BRANCH_CHANGES.md` - 舊的變更記錄

#### 新增的檔案
- ✅ `database/migrations/001_fix_case_and_risk_event.sql` - Migration 腳本
- ✅ `database/migrations/MIGRATION_SUMMARY.md` - Migration 說明
- ✅ `CHANGELOG.md` - 更新記錄（本檔案）

### 🔧 技術細節

#### 後端修改
- `backend/src/controllers/businessManagementController.ts` - 新增 createCase
- `backend/src/controllers/orderController.ts` - 新增 hasCase 欄位
- `backend/src/controllers/reviewController.ts` - 簡化評價邏輯
- `backend/src/controllers/ticketController.ts` - 過期票券篩選
- `backend/src/controllers/eventController.ts` - 活動列表篩選
- `backend/src/controllers/listingController.ts` - 價格驗證、售出保護
- `backend/src/controllers/userController.ts` - 賣家頁面過期票券篩選
- `backend/src/routes/index.ts` - 新增 case 路由

#### 前端修改
- `frontend/src/pages/MyOrdersPage.tsx` - 評價和申訴 UI
- `frontend/src/pages/TicketsPage.tsx` - 日期顯示優化
- `frontend/src/pages/MyListingsPage.tsx` - 價格驗證、活動篩選
- `frontend/src/services/api.ts` - 新增 API 類型定義

#### 資料庫修改
- `database/schema.sql` - CASE 表定義、RISK_EVENT 修正
- `backend/src/scripts/createAllTables.ts` - 更新表定義

### 📋 注意事項

1. **Migration 執行**：已執行的 migration 不需要再次執行
2. **環境變數**：確保 `.env` 檔案已正確設定
3. **資料庫連線**：使用 Neon PostgreSQL 雲端資料庫

---

> **日期**: 2025-01-XX  
> **主要修改者**: [您的名字]

