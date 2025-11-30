-- =====================================================
-- Encore 二手票券交易平台測試資料
-- =====================================================

-- 插入測試使用者
INSERT INTO "user" (name, email, phone, password_hash, kyc_level) VALUES
('張小明', 'ming@example.com', '0912345678', '$2a$10$xVqYLGEHxZQ9LJ7VqL.M8uMBE5qzYQgXVJVxVMqUzUq8qZ1qZ1qZ1', 2),
('李小華', 'hua@example.com', '0923456789', '$2a$10$xVqYLGEHxZQ9LJ7VqL.M8uMBE5qzYQgXVJVxVMqUzUq8qZ1qZ1qZ1', 1),
('王大同', 'datong@example.com', '0934567890', '$2a$10$xVqYLGEHxZQ9LJ7VqL.M8uMBE5qzYQgXVJVxVMqUzUq8qZ1qZ1qZ1', 2),
('陳美玲', 'meiling@example.com', '0945678901', '$2a$10$xVqYLGEHxZQ9LJ7VqL.M8uMBE5qzYQgXVJVxVMqUzUq8qZ1qZ1qZ1', 1),
('林志豪', 'zhihao@example.com', '0956789012', '$2a$10$xVqYLGEHxZQ9LJ7VqL.M8uMBE5qzYQgXVJVxVMqUzUq8qZ1qZ1qZ1', 0),
('Admin', 'admin@encore.com', '0900000000', '$2a$10$xVqYLGEHxZQ9LJ7VqL.M8uMBE5qzYQgXVJVxVMqUzUq8qZ1qZ1qZ1', 2);

-- 設定使用者角色
INSERT INTO user_role (user_id, role) VALUES
(1, 'User'),
(2, 'User'),
(3, 'User'),
(4, 'User'),
(5, 'User'),
(6, 'Admin'),
(6, 'User');

-- 插入場館資料
INSERT INTO venue (name, city, address) VALUES
('台北小巨蛋', '台北市', '台北市松山區南京東路四段2號'),
('高雄巨蛋', '高雄市', '高雄市左營區博愛二路757號'),
('台中洲際棒球場', '台中市', '台中市北屯區崇德路三段833號'),
('桃園國際棒球場', '桃園市', '桃園市中壢區領航北路一段1號');

-- 插入座位區域資料（使用統一的 seat_zone）
INSERT INTO seat_zone (venue_id, name, row_count, col_count, notes) VALUES
(1, 'A1搖滾區', 20, 30, '最靠近舞台'),
(1, 'A2搖滾區', 20, 30, '舞台左側'),
(1, 'B區看台', 30, 50, '二樓看台區'),
(1, 'C區看台', 30, 50, '三樓看台區'),
(2, 'VIP區', 15, 25, '最前排貴賓區'),
(2, '紅區', 25, 40, '一樓座位區'),
(2, '藍區', 30, 45, '二樓座位區');

-- 插入活動資料
INSERT INTO event (venue_id, artist, title, event_date, start_time, end_time, status) VALUES
(1, '五月天', '五月天回到那一天演唱會', '2025-12-28', '19:00', '22:00', 'Scheduled'),
(1, '周杰倫', '周杰倫嘉年華世界巡迴演唱會', '2026-01-15', '19:30', '22:30', 'Scheduled'),
(2, '蔡依林', '蔡依林 Ugly Beauty 演唱會', '2025-12-31', '20:00', '23:00', 'Scheduled'),
(1, '林俊傑', '林俊傑 JJ20 世界巡迴演唱會', '2026-02-14', '19:00', '22:00', 'Scheduled'),
(3, 'BLACKPINK', 'BLACKPINK World Tour', '2026-03-01', '18:30', '21:30', 'Scheduled');

-- 插入票券資料
INSERT INTO ticket (event_id, zone_id, seat_label, face_value, original_vendor, serial_no, owner_id, status) VALUES
(1, 1, 'A1-12-18', 3800.00, '拓元售票', 'TKT-2025-001', 1, 'Valid'),
(1, 1, 'A1-12-19', 3800.00, '拓元售票', 'TKT-2025-002', 1, 'Valid'),
(1, 2, 'A2-5-10', 3500.00, '拓元售票', 'TKT-2025-003', 2, 'Valid'),
(2, 1, 'A1-8-15', 4500.00, '年代售票', 'TKT-2025-004', 3, 'Valid'),
(2, 3, 'B-20-25', 2800.00, '年代售票', 'TKT-2025-005', 3, 'Valid'),
(3, 5, 'VIP-3-12', 5500.00, 'KKTIX', 'TKT-2025-006', 4, 'Valid'),
(4, 1, 'A1-15-20', 4200.00, 'ibon售票', 'TKT-2025-007', 2, 'Valid'),
(5, 1, 'A1-10-10', 6800.00, 'Ticketmaster', 'TKT-2025-008', 1, 'Valid');

-- 插入上架資料
INSERT INTO listing (seller_id, expires_at, status) VALUES
(1, '2025-12-27 23:59:59', 'Active'),
(3, '2026-01-14 23:59:59', 'Active'),
(4, '2025-12-30 23:59:59', 'Active');

-- 插入上架項目
INSERT INTO listing_item (listing_id, ticket_id, price, status) VALUES
(1, 1, 4200.00, 'Active'),
(1, 2, 4200.00, 'Active'),
(2, 4, 5000.00, 'Active'),
(2, 5, 3200.00, 'Active'),
(3, 6, 6000.00, 'Active');

-- 插入一筆完成的訂單作為範例
INSERT INTO "order" (buyer_id, status) VALUES
(5, 'Completed');

INSERT INTO order_item (order_id, listing_id, ticket_id, unit_price) VALUES
(1, 1, 1, 4200.00);

INSERT INTO payment (order_id, method, amount, paid_at, status) VALUES
(1, 'CreditCard', 4200.00, '2025-11-20 14:30:00', 'Success');

INSERT INTO transfer (ticket_id, from_user_id, to_user_id, order_id, result) VALUES
(1, 1, 5, 1, 'Success');

-- 更新票券擁有者
UPDATE ticket SET owner_id = 5, status = 'Transferred' WHERE ticket_id = 1;

-- 插入評價
INSERT INTO review (order_id, reviewer_id, reviewee_id, score, comment) VALUES
(1, 5, 1, 5, '賣家很有誠信，票券真實有效，交易順利！');

-- 插入風險事件範例
INSERT INTO risk_event (user_id, type, ref_id, level) VALUES
(5, 'Login', 5, 1);

