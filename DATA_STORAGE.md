# 資料存儲說明

## 資料存儲位置

所有爬取的活動資料都存儲在 **PostgreSQL 資料庫（Neon）** 中。

### 資料庫連線資訊
- **資料庫類型**: PostgreSQL (Neon)
- **連線字串**: 存儲在 `backend/.env` 檔案中的 `NEON_DATABASE_URL`
- **資料庫名稱**: `neondb`

### 存儲的資料表

#### 1. **EVENT 表** - 活動資訊
存儲所有活動的基本資訊：
- `event_id` - 活動 ID
- `venue_id` - 場館 ID
- `artist` - 藝人/團體名稱
- `title` - 活動標題
- `event_date` - 活動日期
- `start_time` - 開始時間
- `end_time` - 結束時間
- `status` - 狀態（Scheduled/Finished/Cancelled）
- **`image_url`** - 活動圖片 URL（新增）

#### 2. **VENUE 表** - 場館資訊
存儲場館資訊：
- `venue_id` - 場館 ID
- `name` - 場館名稱
- `city` - 城市
- `address` - 地址

#### 3. **SEAT_ZONE 表** - 座位區域
存儲每個場館的座位區域：
- `zone_id` - 區域 ID
- `venue_id` - 場館 ID
- `name` - 區域名稱（如：A1搖滾區）
- `row_count` - 行數
- `col_count` - 列數
- `notes` - 備註

#### 4. **TICKET 表** - 票券資訊
存儲所有票券資料：
- `ticket_id` - 票券 ID
- `event_id` - 活動 ID
- `zone_id` - 座位區域 ID
- `seat_label` - 座位標籤（如：A1-12-18）
- `face_value` - 面額價格
- `original_vendor` - 原始售票平台
- `serial_no` - 序號
- `owner_id` - 擁有者 ID
- `status` - 狀態

### 資料流程

1. **爬蟲腳本執行** (`npm run scrape:events`)
   - 從 Tixcraft/KKTIX 爬取活動資訊（或使用範例資料）
   - 將資料匯入 PostgreSQL 資料庫

2. **資料存儲**
   - 活動 → `event` 表
   - 場館 → `venue` 表
   - 座位區域 → `seat_zone` 表
   - 範例票券 → `ticket` 表

3. **API 讀取**
   - 後端 API 從 PostgreSQL 讀取資料
   - 返回 JSON 格式給前端

4. **前端顯示**
   - 前端從 API 獲取資料
   - 顯示活動列表、圖片等

### 查看資料

您可以透過以下方式查看資料：

1. **透過 API**:
   ```bash
   curl http://localhost:3000/api/events
   ```

2. **透過資料庫查詢**:
   ```sql
   SELECT * FROM event;
   SELECT * FROM venue;
   SELECT * FROM seat_zone;
   SELECT * FROM ticket;
   ```

3. **透過後端腳本**:
   ```bash
   cd backend
   npm run db:test  # 測試連線
   ```

### 圖片存儲

- **圖片 URL**: 存儲在 `event.image_url` 欄位中
- **圖片來源**: 
  - 實際爬取時：從網站提取的圖片 URL
  - 範例資料：使用 Unsplash 的圖片 URL
- **圖片存儲方式**: 只存儲 URL，不存儲實際圖片檔案
- **圖片顯示**: 前端直接從 URL 載入圖片

### 注意事項

1. 所有資料都存儲在雲端 PostgreSQL（Neon）中
2. 圖片只存儲 URL，實際圖片存儲在外部伺服器（如 Unsplash）
3. 資料會持久化保存，除非手動刪除
4. 爬取的資料會自動去重，避免重複匯入

