/**
 * 根據 schema.sql 建立所有必要的資料表
 * 確保所有 API 都能正常運作
 */

import dotenv from 'dotenv';
dotenv.config();

import pool from '../config/database.js';

async function createAllTables() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        建立所有資料表                                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const tables = [
    {
      name: 'user',
      sql: `
        CREATE TABLE IF NOT EXISTS "user" (
          user_id BIGSERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          phone VARCHAR(20) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          kyc_level INT NOT NULL DEFAULT 0 CHECK (kyc_level >= 0 AND kyc_level <= 2),
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `,
    },
    {
      name: 'user_role',
      sql: `
        CREATE TABLE IF NOT EXISTS user_role (
          user_id BIGINT NOT NULL,
          role VARCHAR(20) NOT NULL CHECK (role IN ('User', 'BusinessOperator', 'Admin')),
          PRIMARY KEY (user_id, role),
          FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE
        );
      `,
    },
    {
      name: 'venue',
      sql: `
        CREATE TABLE IF NOT EXISTS venue (
          venue_id BIGSERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          city VARCHAR(50) NOT NULL,
          address VARCHAR(150) NOT NULL
        );
      `,
    },
    {
      name: 'seat_zone',
      sql: `
        CREATE TABLE IF NOT EXISTS seat_zone (
          zone_id BIGSERIAL PRIMARY KEY,
          venue_id BIGINT NOT NULL,
          name VARCHAR(50) NOT NULL,
          row_count INT NOT NULL,
          col_count INT NOT NULL,
          notes VARCHAR(100),
          FOREIGN KEY (venue_id) REFERENCES venue(venue_id) ON DELETE CASCADE ON UPDATE CASCADE
        );
      `,
    },
    {
      name: 'event',
      sql: `
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
      `,
    },
    {
      name: 'ticket',
      sql: `
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
      `,
    },
    {
      name: 'listing',
      sql: `
        CREATE TABLE IF NOT EXISTS listing (
          listing_id BIGSERIAL PRIMARY KEY,
          seller_id BIGINT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP,
          status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Sold', 'Expired', 'Cancelled')),
          FOREIGN KEY (seller_id) REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE
        );
      `,
    },
    {
      name: 'listing_item',
      sql: `
        CREATE TABLE IF NOT EXISTS listing_item (
          listing_id BIGINT NOT NULL,
          ticket_id BIGINT NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Sold', 'Expired', 'Cancelled')),
          PRIMARY KEY (listing_id, ticket_id),
          FOREIGN KEY (listing_id) REFERENCES listing(listing_id) ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id) ON DELETE CASCADE ON UPDATE CASCADE
        );
      `,
    },
    {
      name: 'order',
      sql: `
        CREATE TABLE IF NOT EXISTS "order" (
          order_id BIGSERIAL PRIMARY KEY,
          buyer_id BIGINT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Cancelled', 'Completed')),
          FOREIGN KEY (buyer_id) REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE
        );
      `,
    },
    {
      name: 'order_item',
      sql: `
        CREATE TABLE IF NOT EXISTS order_item (
          order_id BIGINT NOT NULL,
          listing_id BIGINT NOT NULL,
          ticket_id BIGINT NOT NULL,
          unit_price DECIMAL(10, 2) NOT NULL,
          PRIMARY KEY (order_id, listing_id, ticket_id),
          FOREIGN KEY (order_id) REFERENCES "order"(order_id) ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY (listing_id, ticket_id) REFERENCES listing_item(listing_id, ticket_id) ON DELETE CASCADE ON UPDATE CASCADE
        );
      `,
    },
    {
      name: 'payment',
      sql: `
        CREATE TABLE IF NOT EXISTS payment (
          payment_id BIGSERIAL PRIMARY KEY,
          order_id BIGINT NOT NULL UNIQUE,
          method VARCHAR(20) NOT NULL CHECK (method IN ('CreditCard', 'Bank', 'Wallet')),
          amount DECIMAL(10, 2) NOT NULL,
          paid_at TIMESTAMP,
          status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Success', 'Failed')),
          FOREIGN KEY (order_id) REFERENCES "order"(order_id) ON DELETE CASCADE ON UPDATE CASCADE
        );
      `,
    },
    {
      name: 'transfer',
      sql: `
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
      `,
    },
    {
      name: 'review',
      sql: `
        CREATE TABLE IF NOT EXISTS review (
          review_id BIGSERIAL PRIMARY KEY,
          order_id BIGINT NOT NULL,
          reviewer_id BIGINT NOT NULL,
          reviewee_id BIGINT NOT NULL,
          score INT NOT NULL CHECK (score >= 1 AND score <= 5),
          comment VARCHAR(200),
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES "order"(order_id) ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY (reviewer_id) REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY (reviewee_id) REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE
        );
      `,
    },
    {
      name: 'blacklist',
      sql: `
        CREATE TABLE IF NOT EXISTS blacklist (
          user_id BIGINT PRIMARY KEY,
          reason VARCHAR(200) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE
        );
      `,
    },
    {
      name: 'case',
      sql: `
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
      `,
    },
    {
      name: 'risk_event',
      sql: `
        CREATE TABLE IF NOT EXISTS risk_event (
          risk_id BIGSERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL,
          type VARCHAR(30) NOT NULL CHECK (type IN ('Login', 'Fraud', 'Transfer', 'Payment')),
          ref_id BIGINT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          level INT NOT NULL CHECK (level >= 1 AND level <= 5),
          FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE
        );
      `,
    },
  ];

  const createdTables: string[] = [];
  const skippedTables: string[] = [];

  for (const table of tables) {
    try {
      await pool.query(table.sql);
      createdTables.push(table.name);
      console.log(`✅ ${table.name} 表建立成功`);
    } catch (error: any) {
      if (error.code === '42P07' || error.message.includes('already exists')) {
        skippedTables.push(table.name);
        console.log(`⏭️  ${table.name} 表已存在，跳過`);
      } else {
        console.error(`❌ ${table.name} 表建立失敗:`, error.message);
      }
    }
  }

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                    建立結果                              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`✅ 成功建立: ${createdTables.length} 個表`);
  if (skippedTables.length > 0) {
    console.log(`⏭️  已存在: ${skippedTables.length} 個表`);
  }
  console.log(`📊 總計: ${createdTables.length + skippedTables.length} 個表`);

  // 建立索引
  console.log('\n📊 正在建立索引...');
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email)',
    'CREATE INDEX IF NOT EXISTS idx_user_phone ON "user"(phone)',
    'CREATE INDEX IF NOT EXISTS idx_event_date ON event(event_date)',
    'CREATE INDEX IF NOT EXISTS idx_event_venue ON event(venue_id)',
    'CREATE INDEX IF NOT EXISTS idx_event_status ON event(status)',
    'CREATE INDEX IF NOT EXISTS idx_ticket_event ON ticket(event_id)',
    'CREATE INDEX IF NOT EXISTS idx_ticket_owner ON ticket(owner_id)',
    'CREATE INDEX IF NOT EXISTS idx_ticket_status ON ticket(status)',
    'CREATE INDEX IF NOT EXISTS idx_listing_seller ON listing(seller_id)',
    'CREATE INDEX IF NOT EXISTS idx_listing_status ON listing(status)',
    'CREATE INDEX IF NOT EXISTS idx_listing_item_status ON listing_item(status)',
    'CREATE INDEX IF NOT EXISTS idx_order_buyer ON "order"(buyer_id)',
    'CREATE INDEX IF NOT EXISTS idx_order_status ON "order"(status)',
    'CREATE INDEX IF NOT EXISTS idx_order_created ON "order"(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_review_reviewee ON review(reviewee_id)',
    'CREATE INDEX IF NOT EXISTS idx_review_order ON review(order_id)',
    'CREATE INDEX IF NOT EXISTS idx_case_order ON "case"(order_id)',
    'CREATE INDEX IF NOT EXISTS idx_case_reporter ON "case"(reporter_id)',
    'CREATE INDEX IF NOT EXISTS idx_case_status ON "case"(status)',
    'CREATE INDEX IF NOT EXISTS idx_risk_user ON risk_event(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_risk_type ON risk_event(type)',
  ];

  let indexCount = 0;
  for (const indexSql of indexes) {
    try {
      await pool.query(indexSql);
      indexCount++;
    } catch (error: any) {
      // 忽略索引建立錯誤（可能已存在）
    }
  }
  console.log(`✅ 已建立 ${indexCount} 個索引`);

  console.log('\n🎉 所有資料表建立完成！');
  await pool.end();
  process.exit(0);
}

createAllTables().catch((error) => {
  console.error('建立資料表時發生錯誤:', error);
  process.exit(1);
});



