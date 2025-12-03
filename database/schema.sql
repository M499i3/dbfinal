-- =====================================================
-- Encore 二手票券交易平台資料庫 Schema
-- 根據期末專案計劃書設計，並納入助教評論修正
-- 修正項目：
--   1. 統一使用 SEAT_ZONE（而非 SEATZONE）
--   2. REVIEW 表中統一使用 reviewee_id（而非 Reveiwee_id/Target_user_id）
-- =====================================================

-- 建立資料庫
-- CREATE DATABASE encore;

-- 使用資料庫
-- \c encore;

-- =====================================================
-- 第一部分：使用者與權限
-- =====================================================

-- 表 1: USER - 使用者基本資料表
CREATE TABLE IF NOT EXISTS "user" (
    user_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    kyc_level INT NOT NULL DEFAULT 0 CHECK (kyc_level >= 0 AND kyc_level <= 2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 表 2: USER_ROLE - 使用者角色表
CREATE TABLE IF NOT EXISTS user_role (
    user_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('User', 'BusinessOperator', 'Admin')),
    PRIMARY KEY (user_id, role),
    FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- 第二部分：場館與活動
-- =====================================================

-- 表 3: VENUE - 場館資料表
CREATE TABLE IF NOT EXISTS venue (
    venue_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    address VARCHAR(150) NOT NULL
);

-- 表 4: SEAT_ZONE - 座位區域表（統一使用 SEAT_ZONE）
CREATE TABLE IF NOT EXISTS seat_zone (
    zone_id BIGSERIAL PRIMARY KEY,
    venue_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    row_count INT NOT NULL,
    col_count INT NOT NULL,
    notes VARCHAR(100),
    FOREIGN KEY (venue_id) REFERENCES venue(venue_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 表 5: EVENT - 活動資料表
CREATE TABLE IF NOT EXISTS event (
    event_id BIGSERIAL PRIMARY KEY,
    venue_id BIGINT NOT NULL,
    artist VARCHAR(100) NOT NULL,
    title VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Finished', 'Cancelled')),
    image_url VARCHAR(500),
    FOREIGN KEY (venue_id) REFERENCES venue(venue_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- 第三部分：票券與交易流程
-- =====================================================

-- 表 6: TICKET - 票券資料表
CREATE TABLE IF NOT EXISTS ticket (
    ticket_id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    zone_id BIGINT NOT NULL,
    seat_label VARCHAR(20) NOT NULL,
    face_value DECIMAL(10, 2) NOT NULL,
    original_vendor VARCHAR(50),
    serial_no VARCHAR(50) UNIQUE,
    owner_id BIGINT,
    status VARCHAR(20) NOT NULL DEFAULT 'Valid' CHECK (status IN ('Valid', 'Used', 'Transferred', 'Cancelled')),
    FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (zone_id) REFERENCES seat_zone(zone_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES "user"(user_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 表 7: LISTING - 上架刊登資料表
CREATE TABLE IF NOT EXISTS listing (
    listing_id BIGSERIAL PRIMARY KEY,
    seller_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Sold', 'Expired', 'Cancelled', 'Rejected')),
    risk_flags TEXT,  -- JSON array of risk reasons
    reviewed_by BIGINT,
    reviewed_at TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES "user"(user_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 表 8: LISTING_ITEM - 上架項目資料表（票券與上架的關聯）
CREATE TABLE IF NOT EXISTS listing_item (
    listing_id BIGINT NOT NULL,
    ticket_id BIGINT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Sold', 'Expired', 'Cancelled')),
    PRIMARY KEY (listing_id, ticket_id),
    FOREIGN KEY (listing_id) REFERENCES listing(listing_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 表 9: ORDER - 訂單資料表
CREATE TABLE IF NOT EXISTS "order" (
    order_id BIGSERIAL PRIMARY KEY,
    buyer_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Cancelled', 'Completed')),
    FOREIGN KEY (buyer_id) REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 表 10: ORDER_ITEM - 訂單項目資料表
CREATE TABLE IF NOT EXISTS order_item (
    order_id BIGINT NOT NULL,
    listing_id BIGINT NOT NULL,
    ticket_id BIGINT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (order_id, listing_id, ticket_id),
    FOREIGN KEY (order_id) REFERENCES "order"(order_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (listing_id, ticket_id) REFERENCES listing_item(listing_id, ticket_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 表 11: PAYMENT - 付款資料表
CREATE TABLE IF NOT EXISTS payment (
    payment_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE,
    method VARCHAR(20) NOT NULL CHECK (method IN ('CreditCard', 'Bank', 'Wallet')),
    amount DECIMAL(10, 2) NOT NULL,
    paid_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Success', 'Failed')),
    FOREIGN KEY (order_id) REFERENCES "order"(order_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 表 12: TRANSFER - 票券轉移紀錄表
CREATE TABLE IF NOT EXISTS transfer (
    transfer_id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    from_user_id BIGINT NOT NULL,
    to_user_id BIGINT NOT NULL,
    order_id BIGINT,
    trans_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    result VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (result IN ('Success', 'Failed', 'Pending')),
    FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (from_user_id) REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (order_id) REFERENCES "order"(order_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- =====================================================
-- 第四部分：信任與風險管理
-- =====================================================

-- 表 13: REVIEW - 評價資料表
-- 注意：統一使用 reviewee_id（根據助教評論修正）
CREATE TABLE IF NOT EXISTS review (
    review_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    reviewer_id BIGINT NOT NULL,
    reviewee_id BIGINT NOT NULL,  -- 統一命名（原 Reveiwee_id / Target_user_id）
    score INT NOT NULL CHECK (score >= 1 AND score <= 5),
    comment VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES "order"(order_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (reviewee_id) REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 表 14: CASE - 申訴案件資料表
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

-- 表 15: BLACKLIST - 黑名單資料表
CREATE TABLE IF NOT EXISTS blacklist (
    user_id BIGINT PRIMARY KEY,
    reason VARCHAR(200) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 表 16: RISK_EVENT - 風險事件資料表
CREATE TABLE IF NOT EXISTS risk_event (
    risk_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('Login', 'Fraud', 'Transfer', 'Payment')),
    ref_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    level INT NOT NULL CHECK (level >= 1 AND level <= 5),
    FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- 建立索引以優化查詢效能
-- =====================================================

-- 使用者相關索引
CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_user_phone ON "user"(phone);

-- 活動相關索引
CREATE INDEX idx_event_date ON event(event_date);
CREATE INDEX idx_event_venue ON event(venue_id);
CREATE INDEX idx_event_status ON event(status);

-- 票券相關索引
CREATE INDEX idx_ticket_event ON ticket(event_id);
CREATE INDEX idx_ticket_owner ON ticket(owner_id);
CREATE INDEX idx_ticket_status ON ticket(status);

-- 上架相關索引
CREATE INDEX idx_listing_seller ON listing(seller_id);
CREATE INDEX idx_listing_status ON listing(status);
CREATE INDEX idx_listing_item_status ON listing_item(status);

-- 訂單相關索引
CREATE INDEX idx_order_buyer ON "order"(buyer_id);
CREATE INDEX idx_order_status ON "order"(status);
CREATE INDEX idx_order_created ON "order"(created_at);

-- 評價相關索引
CREATE INDEX idx_review_reviewee ON review(reviewee_id);
CREATE INDEX idx_review_order ON review(order_id);

-- 風險相關索引
CREATE INDEX idx_risk_user ON risk_event(user_id);
CREATE INDEX idx_risk_type ON risk_event(type);

