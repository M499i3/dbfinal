-- Migration: 添加票券上架審核功能
-- 日期: 2025-12-06

-- 添加審核狀態欄位到 listing 表
ALTER TABLE listing 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'Pending' 
CHECK (approval_status IN ('Pending', 'Approved', 'Rejected'));

-- 將現有的 Active 狀態上架設為已審核通過
UPDATE listing 
SET approval_status = 'Approved' 
WHERE status = 'Active' AND approval_status IS NULL;

-- 將 Cancelled, Sold, Expired 狀態的上架設為已審核（歷史記錄）
UPDATE listing 
SET approval_status = 'Approved' 
WHERE status IN ('Cancelled', 'Sold', 'Expired') AND approval_status IS NULL;

-- 添加索引以優化查詢
CREATE INDEX IF NOT EXISTS idx_listing_approval_status ON listing(approval_status);
CREATE INDEX IF NOT EXISTS idx_listing_status_approval ON listing(status, approval_status);

