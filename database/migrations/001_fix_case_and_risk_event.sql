-- =====================================================
-- Migration: 修正 CASE 表和 RISK_EVENT 表
-- 日期: 2025-01-XX
-- =====================================================

-- [目標 1] 建立 CASE 資料表（如果不存在）
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

-- [目標 2] 修正 RISK_EVENT 表，將 ref_id 改為 NOT NULL
-- 注意：如果表中已有資料且 ref_id 為 NULL，需要先處理這些資料
-- 
-- 業務邏輯說明：
-- - Login 類型：ref_id 應使用 user_id
-- - Fraud 類型：ref_id 應使用相關的 listing_id 或 order_id
-- - Transfer/Payment 類型：ref_id 應使用相關的 order_id 或 transfer_id
--
-- 步驟 1: 將現有的 NULL ref_id 更新為 user_id（對於 Login 類型）或 0（其他類型）
-- 注意：請根據實際業務邏輯調整此更新語句
UPDATE risk_event 
SET ref_id = CASE 
    WHEN type = 'Login' THEN user_id
    ELSE 0
END
WHERE ref_id IS NULL;

-- 步驟 2: 將 ref_id 欄位改為 NOT NULL
ALTER TABLE risk_event 
    ALTER COLUMN ref_id SET NOT NULL;

-- 建立索引（如果尚未存在）
CREATE INDEX IF NOT EXISTS idx_case_order ON "case"(order_id);
CREATE INDEX IF NOT EXISTS idx_case_reporter ON "case"(reporter_id);
CREATE INDEX IF NOT EXISTS idx_case_status ON "case"(status);

