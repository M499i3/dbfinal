# 期末專案需求檢查報告

## 1. NoSQL 資料庫使用情況

### 現況：
**✅ YES - MongoDB 已配置但未充分使用**

根據 `DATA_STORAGE.md` 和 `backend/src/config/database.ts`：
- MongoDB Atlas 連線已配置
- 連線成功（後端啟動時顯示 "✅ MongoDB 連線成功"）
- **但實際上所有資料都存在 PostgreSQL 中**

---

## 2. 大量資料需求（上萬筆）

### 現況檢查：

讓我查詢當前資料量...

#### **當前資料表數量：16 張** ✅（超過10張要求）

1. user
2. user_role
3. venue
4. seat_zone
5. event
6. ticket
7. listing
8. listing_item
9. order
10. order_item
11. payment
12. transfer
13. review
14. case
15. blacklist
16. risk_event
17. **listing_risk_flag**（新增）
18. **case_note**（新增）

實際：**18 張表** ✅

#### **大量資料表（需上萬筆）：**

根據你的 dashboard 顯示 "481 tickets"，目前 **TICKET 表不足 10,000 筆** ❌

**需要補充的表**：
- **TICKET 表**：目前 ~481 筆 → 需要增加到 10,000+ 筆
- **LISTING 表**：相應增加
- **ORDER 表**：需要模擬歷史交易
- **TRANSFER 表**：票券轉移紀錄
- **REVIEW 表**：用戶評價

**自然會有大量資料的表**：
1. ✅ **TICKET** - 每場活動數千張票
2. ✅ **LISTING_ITEM** - 每個上架可能多張票
3. ✅ **ORDER_ITEM** - 歷史訂單項目
4. ✅ **TRANSFER** - 票券轉移歷史
5. ✅ **REVIEW** - 買賣雙方互評
6. ✅ **RISK_EVENT** - 風險事件紀錄

---

## 3. Schema 設計與正規化

### 當前正規化程度分析：

#### **✅ 良好的正規化設計**：

**1. 第一正規化 (1NF)** ✅
- 所有表都有主鍵
- 所有欄位都是原子性（atomic）
- 沒有重複群組

**2. 第二正規化 (2NF)** ✅
- 所有非鍵屬性完全依賴於主鍵
- 例如：`ticket` 表中的 `face_value` 依賴於整個 `ticket_id`

**3. 第三正規化 (3NF)** ✅
- 消除了傳遞依賴
- 例如：場館資訊獨立成 `venue` 表，不直接存在 `event` 表中

#### **正規化範例**：

**✅ 良好設計**：
```sql
-- Venue 獨立表（避免重複）
CREATE TABLE venue (venue_id, name, city, address);

-- Event 只參照 venue_id
CREATE TABLE event (event_id, venue_id, artist, title, ...);
```

**❌ 如果沒正規化**（會重複存儲）：
```sql
CREATE TABLE event (
  event_id, artist, title,
  venue_name, venue_city, venue_address  -- 重複！
);
```

#### **適當的反正規化（效能考量）**：

有些地方你做了適當的反正規化以提升查詢效能：

```sql
-- listing 表直接存 seller_id（而非另建 listing_seller 表）
-- 這是合理的，因為一個 listing 只有一個 seller

-- order 表直接存 buyer_id
-- 合理，因為訂單只有一個買家
```

#### **複合主鍵的使用** ✅：

```sql
-- listing_item: (listing_id, ticket_id) 複合主鍵
-- order_item: (order_id, listing_id, ticket_id) 複合主鍵
-- user_role: (user_id, role) 複合主鍵
```

這些都是正確的多對多關聯設計。

#### **索引設計** ✅：

查看 schema.sql 底部：
```sql
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

-- 評價相關索引
CREATE INDEX idx_review_reviewee ON review(reviewee_id);

-- 風險相關索引
CREATE INDEX idx_risk_user ON risk_event(user_id);
```

**✅ 索引設計良好**，涵蓋了常用查詢欄位。

#### **Status 欄位的使用**（避免硬刪除）：

你的系統 **正確使用了 status 欄位**：

1. **TICKET**: `status IN ('Valid', 'Used', 'Transferred', 'Cancelled')` ✅
   - 不直接 DELETE，用 status 標記
   
2. **LISTING**: `status IN ('Pending', 'Active', 'Sold', 'Expired', 'Cancelled', 'Rejected')` ✅
   - 保留歷史紀錄

3. **ORDER**: `status IN ('Pending', 'Paid', 'Cancelled', 'Completed')` ✅
   - 交易狀態追蹤

4. **PAYMENT**: `status IN ('Pending', 'Success', 'Failed')` ✅

**✅ 這符合課程要求的軟刪除（soft delete）設計**

---

## 4. 交易管理與併行控制

### 現況：**✅ YES - 已實作**

#### **交易管理位置（Transaction Management）**：

**1. 建立上架（createListing）** - `listingController.ts`
```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  
  // 1. 檢查票券所有權
  // 2. 檢查是否已上架
  // 3. 風險評估
  // 4. 建立 listing
  // 5. 建立 listing_item（可能多筆）
  // 6. 儲存 risk_flags
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
}
```

**為什麼需要 Transaction**：
- 確保 listing 和 listing_item 同時建立或同時失敗
- 避免 listing 建立成功但 listing_item 失敗的不一致狀態

**2. 處理退款（processCaseRefund）** - `businessManagementController.ts`
```typescript
await pool.query('BEGIN');

// 1. 檢查案件和訂單狀態
// 2. 建立退款記錄（payment）
// 3. 更新訂單狀態為 Cancelled
// 4. 更新 listing_item 狀態（如果全額退款）
// 5. 更新 listing 狀態
// 6. 新增案件備註

await pool.query('COMMIT');
// 如果任何步驟失敗 → ROLLBACK
```

**為什麼需要 Transaction**：
- 退款涉及多表更新（payment, order, listing_item, listing, case_note）
- 必須全部成功或全部失敗，避免錢退了但票沒歸還的情況

**3. 批准/拒絕上架** - `businessManagementController.ts`
```typescript
await pool.query('BEGIN');

// 更新 listing 狀態
// 更新所有 listing_item 狀態

await pool.query('COMMIT');
```

#### **併行控制（Concurrency Control）**：

**1. UNIQUE 約束**：
```sql
-- 防止重複註冊
email VARCHAR(100) NOT NULL UNIQUE
phone VARCHAR(20) NOT NULL UNIQUE

-- 防止票券序號重複
serial_no VARCHAR(50) UNIQUE
```

**2. CHECK 約束**：
```sql
-- 確保狀態值有效
status VARCHAR(20) CHECK (status IN ('Valid', 'Used', ...))
```

**3. 票券上架檢查**（防止同一票券多次上架）：
```typescript
const activeListingCheck = await client.query(
  `SELECT li.ticket_id FROM listing_item li
   JOIN listing l ON li.listing_id = l.listing_id
   WHERE li.ticket_id = ANY($1) AND (l.status = 'Active' OR l.status = 'Pending')`,
  [ticketIds]
);

if (activeListingCheck.rows.length > 0) {
  return error('部分票券已經在上架中或等待審核');
}
```

**4. Foreign Key 約束**：
```sql
FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE
```

---

## 📊 需求對照表

| 需求 | 現況 | 需補充 |
|------|------|--------|
| **兩個資料庫** | ⚠️ 部分達成 | MongoDB 已連線但未使用，需實作用戶行為紀錄 |
| **關聯式 DB 表數 ≥10** | ✅ 18 張表 | 已達成 |
| **某表資料 ≥10,000 筆** | ❌ ~481 筆 | 需增加 TICKET 資料到 10,000+ 筆 |
| **複雜查詢（JOIN 多表）** | ✅ 有 | 例如：getAvailableTickets 結合 6 張表 |
| **良好 Schema 設計** | ✅ 優秀 | 正規化、索引、外鍵都有 |
| **正規化考量** | ✅ 3NF | 有適當反正規化 |
| **索引設計** | ✅ 完整 | 涵蓋常用查詢欄位 |
| **交易管理** | ✅ 有 | createListing, refund 等 |
| **併行控制** | ✅ 有 | UNIQUE, CHECK, 上架檢查 |
| **使用 status 避免 DELETE** | ✅ 完美 | 所有表都用 status |
| **有意義的資料分析** | ✅ 有 | 統計、風險評估、審核系統 |

---

## 🎯 需要補充的項目：

### Priority 1: **增加 TICKET 資料到 10,000+ 筆**
建議腳本：為每個活動生成合理數量的票券（每場 300-500 張）

### Priority 2: **實作 MongoDB 用戶行為追蹤**
- 搜尋活動紀錄
- 瀏覽活動紀錄
- 票券查看紀錄
- 分析功能：熱門搜尋、熱門活動

### Priority 3: **增強資料分析功能**
利用大量資料做有意義的分析

---

## ✅ 你的系統優勢

1. **複雜的業務邏輯** - 二手票券交易、風險評估、審核系統
2. **完整的信任機制** - 評價、黑名單、申訴、KYC
3. **良好的資料庫設計** - 正規化、索引、約束完整
4. **交易安全** - BEGIN/COMMIT/ROLLBACK 保證一致性
5. **軟刪除設計** - 保留歷史，用 status 管理

**Would you like me to:**
1. ✅ Implement MongoDB user activity tracking?
2. ✅ Create script to generate 10,000+ tickets?
3. ✅ Build analytics dashboard using the large dataset?

