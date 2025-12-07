# 更新記錄

## 2025-12-06 - 訂單超時機制與票券審核系統

### ⏰ 訂單超時自動取消功能

#### 功能實現
- ✅ 訂單創建後 5 分鐘內未付款將自動取消
- ✅ 後端定時任務每 1 分鐘檢查一次超時訂單
- ✅ 超時訂單自動釋放票券，狀態改回 Active
- ✅ 前端顯示訂單狀態和倒計時（已移除顯示，保留後台功能）

#### 技術實現
- 新增 `backend/src/services/orderTimeoutService.ts` 定時服務
- 在 `app.ts` 中啟動定時任務
- 使用資料庫事務確保資料一致性

### 🔍 票券上架審核系統

#### 資料庫 Schema 更新
- ✅ 在 `listing` 表中添加 `approval_status` 欄位（Pending, Approved, Rejected）
- ✅ 新增 Migration 文件：`002_add_listing_approval_status.sql`
- ✅ 建立索引優化查詢性能

#### 審核流程
- ✅ 用戶上架票券後，狀態為 `Pending`（待審核）
- ✅ Admin 在「審核上架」頁面可以審核通過或拒絕
- ✅ 只有審核通過的票券才能被其他用戶瀏覽和購買
- ✅ 用戶端顯示：審核中 → 上架中（審核通過後）

#### 功能分離
- ✅ 「審核上架」頁面：處理待審核的上架（通過/拒絕）
- ✅ 「管理票券」頁面：管理已審核通過的上架（下架功能）

### 🐛 Bug 修復

#### 訂單查詢重複問題
- ✅ 修復 `getMyOrders` 查詢導致訂單重複顯示的問題
- ✅ 優化 SQL 查詢，使用子查詢獲取 payment 資訊

#### 時區問題修復
- ✅ 修復訂單創建時間顯示問題
- ✅ 確保後端返回 UTC 時間的 ISO 8601 格式字符串
- ✅ 前端正確解析 UTC 時間

#### 活動選擇問題
- ✅ 修復上架票券時無法選擇活動的問題
- ✅ 優化活動查詢邏輯，確保返回所有未結束的活動

### 📝 狀態顯示優化

#### 用戶上架狀態
- ✅ 審核中：`approval_status = 'Pending'` → 顯示「審核中」（黃色）
- ✅ 上架中：`approval_status = 'Approved'` 且 `status = 'Active'` → 顯示「上架中」（綠色）
- ✅ 已拒絕：`approval_status = 'Rejected'` → 顯示「已拒絕」（紅色）

### 🗂️ 檔案整理

#### 新增的檔案
- ✅ `backend/src/services/orderTimeoutService.ts` - 訂單超時服務
- ✅ `database/migrations/002_add_listing_approval_status.sql` - 審核功能 Migration

#### 修改的檔案
- ✅ `backend/src/controllers/orderController.ts` - 訂單查詢優化、時間格式處理、超時檢查
- ✅ `backend/src/controllers/listingController.ts` - 新上架默認為待審核、返回審核狀態
- ✅ `backend/src/controllers/ticketController.ts` - 只顯示已審核通過的票券
- ✅ `backend/src/controllers/eventController.ts` - 活動查詢優化、審核狀態過濾
- ✅ `backend/src/controllers/businessManagementController.ts` - 新增審核功能（approve/reject）
- ✅ `backend/src/controllers/userController.ts` - 賣家頁面只顯示已審核通過的票券
- ✅ `backend/src/routes/index.ts` - 新增審核路由
- ✅ `backend/src/app.ts` - 啟動訂單超時服務
- ✅ `backend/src/scripts/createAllTables.ts` - 更新 listing 表定義
- ✅ `database/schema.sql` - 添加 approval_status 欄位
- ✅ `frontend/src/pages/MyOrdersPage.tsx` - 移除倒計時顯示、清理調試代碼
- ✅ `frontend/src/pages/MyListingsPage.tsx` - 狀態顯示優化、審核狀態顯示
- ✅ `frontend/src/pages/BusinessListingsPage.tsx` - 審核功能 UI、審核狀態篩選
- ✅ `frontend/src/pages/BusinessTicketsPage.tsx` - 下架功能 UI、只顯示已審核通過
- ✅ `frontend/src/services/api.ts` - 更新 Listing 接口、添加審核狀態

---

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



