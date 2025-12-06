# 資料庫 Schema 修正總結

## 修正日期
2025-01-XX

## 修正內容

### [目標 1] CASE 資料表
✅ **已完成**

CASE 表已在 `database/schema.sql` 中正確定義，符合以下規格：
- `case_id` BIGSERIAL PRIMARY KEY
- `order_id` BIGINT NOT NULL (FK -> ORDER, CASCADE)
- `reporter_id` BIGINT NOT NULL (FK -> USER, CASCADE)
- `type` VARCHAR(30) NOT NULL (Domain: Fraud, Delivery, Refund, Other)
- `status` VARCHAR(20) NOT NULL (Domain: Open, InProgress, Closed)
- `opened_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- `closed_at` TIMESTAMP (可為 NULL)

**修改檔案：**
- `database/schema.sql` - CASE 表定義已存在且正確
- `backend/src/scripts/createAllTables.ts` - 已添加 CASE 表定義

### [目標 2] RISK_EVENT 表修正
✅ **已完成**

將 `ref_id` 欄位從 NULLABLE 改為 NOT NULL。

**修改內容：**
- `database/schema.sql` - 將 `ref_id BIGINT` 改為 `ref_id BIGINT NOT NULL`
- `backend/src/scripts/createAllTables.ts` - 將 `ref_id BIGINT` 改為 `ref_id BIGINT NOT NULL`
- `database/migrations/001_fix_case_and_risk_event.sql` - 創建 migration 腳本

**Migration 步驟：**
1. 將現有的 NULL `ref_id` 更新為 0（或根據業務邏輯調整）
2. 將 `ref_id` 欄位改為 NOT NULL

### [目標 3] 後端程式碼修正
✅ **已完成**

修正所有 `INSERT INTO risk_event` 語句，確保包含 `ref_id` 欄位。

**修改檔案：**
1. `backend/src/controllers/authController.ts` (第 181-183 行)
   - 修正前：`INSERT INTO risk_event (user_id, type, level)`
   - 修正後：`INSERT INTO risk_event (user_id, type, level, ref_id) VALUES ($1, $2, $3, $4)`
   - 說明：Login 類型的 `ref_id` 使用 `user_id` 作為參考

2. `backend/src/controllers/businessManagementController.ts` (第 277-279 行)
   - 修正前：`INSERT INTO risk_event (user_id, type, level)`
   - 修正後：`INSERT INTO risk_event (user_id, type, level, ref_id) VALUES ($1, 'Fraud', 5, $1)`
   - 說明：加入黑名單時，`ref_id` 使用 `user_id` 作為參考

3. `backend/src/controllers/businessManagementController.ts` (第 117-119 行)
   - ✅ 已包含 `ref_id`，無需修改

4. `backend/src/controllers/businessManagementController.ts` (第 309-312 行)
   - ✅ 已包含 `ref_id`，無需修改

5. `database/seed.sql` (第 95-96 行)
   - 修正前：`INSERT INTO risk_event (user_id, type, ref_id, level) VALUES (5, 'Login', NULL, 1)`
   - 修正後：`INSERT INTO risk_event (user_id, type, ref_id, level) VALUES (5, 'Login', 5, 1)`

**注意：**
- `created_at` 欄位有預設值 `CURRENT_TIMESTAMP`，因此在 INSERT 語句中可以省略
- 所有 INSERT 語句現在都包含 `ref_id` 欄位

### [目標 4] Prisma Schema
⏭️ **跳過**

專案中未使用 Prisma，因此無需更新 Prisma schema。

## 執行 Migration

### 方法 1: 使用 Migration 腳本
```bash
# 連接到 Neon PostgreSQL 資料庫
psql $NEON_DATABASE_URL -f database/migrations/001_fix_case_and_risk_event.sql
```

### 方法 2: 手動執行 SQL
1. 連接到資料庫
2. 執行以下 SQL：

```sql
-- 更新現有的 NULL ref_id
UPDATE risk_event SET ref_id = 0 WHERE ref_id IS NULL;

-- 將 ref_id 改為 NOT NULL
ALTER TABLE risk_event ALTER COLUMN ref_id SET NOT NULL;

-- 建立 CASE 表（如果不存在）
CREATE TABLE IF NOT EXISTS "case" (
    case_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    reporter_id BIGINT NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('Fraud', 'Delivery', 'Refund', 'Other')),
    status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'InProgress', 'Closed')),
    opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES "order"(order_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_case_order ON "case"(order_id);
CREATE INDEX IF NOT EXISTS idx_case_reporter ON "case"(reporter_id);
CREATE INDEX IF NOT EXISTS idx_case_status ON "case"(status);
```

## 驗證

執行以下查詢確認修正是否成功：

```sql
-- 檢查 CASE 表是否存在
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'case';

-- 檢查 RISK_EVENT 表的 ref_id 是否為 NOT NULL
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'risk_event' AND column_name = 'ref_id';

-- 檢查是否有 NULL 的 ref_id
SELECT COUNT(*) FROM risk_event WHERE ref_id IS NULL;
```

## 注意事項

1. **資料遷移**：如果資料庫中已有 `risk_event` 記錄且 `ref_id` 為 NULL，需要先處理這些資料
2. **業務邏輯**：`ref_id` 的具體值應根據業務邏輯設定：
   - Login 類型：可以使用 `user_id`
   - Fraud 類型：可以使用相關的 `listing_id` 或 `order_id`
   - Transfer/Payment 類型：可以使用相關的 `order_id` 或 `transfer_id`
3. **向後兼容**：確保所有現有的 INSERT 語句都已更新，避免執行時錯誤



