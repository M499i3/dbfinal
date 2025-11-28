/**
 * 網頁爬蟲腳本 - 從 Tixcraft 和 KKTIX 爬取活動資訊
 * 
 * 注意事項：
 * 1. 請遵守網站的服務條款和使用規範
 * 2. 建議設定適當的延遲以避免對伺服器造成負擔
 * 3. 此腳本僅供學習和測試用途
 */

import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import pool from '../config/database.js';

interface SeatZone {
  name: string;
  rowCount: number;
  colCount: number;
  notes: string;
  priceRange: { min: number; max: number };
}

interface ScrapedEvent {
  artist: string;
  title: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venueName: string;
  venueCity: string;
  venueAddress: string;
  imageUrl?: string;
  source: 'tixcraft' | 'kktix';
  sourceUrl: string;
  seatZones?: SeatZone[];
}

// 延遲函數
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 爬取 Tixcraft 活動列表
 */
async function scrapeTixcraft(): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];
  
  try {
    console.log('📡 開始爬取 Tixcraft...');
    
    const url = 'https://tixcraft.com/activity';
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    
    $('.activity-item, .event-item, [class*="activity"]').each((index, element) => {
      try {
        const $el = $(element);
        
        const titleText = $el.find('h3, .title, [class*="title"]').first().text().trim();
        const artistText = $el.find('.artist, [class*="artist"]').first().text().trim() || titleText.split(' ')[0];
        const dateText = $el.find('.date, [class*="date"]').first().text().trim();
        const timeText = $el.find('.time, [class*="time"]').first().text().trim();
        const venueText = $el.find('.venue, [class*="venue"]').first().text().trim();
        
        // 嘗試提取圖片
        const imageUrl = $el.find('img').first().attr('src') || 
                        $el.find('img').first().attr('data-src') || 
                        undefined;
        const fullImageUrl = imageUrl?.startsWith('http') 
          ? imageUrl 
          : imageUrl 
            ? `https://tixcraft.com${imageUrl}` 
            : undefined;
        
        const link = $el.find('a').first().attr('href') || '';
        const fullUrl = link.startsWith('http') ? link : `https://tixcraft.com${link}`;
        
        if (titleText && dateText) {
          const parsedDate = parseDate(dateText);
          const parsedTime = parseTime(timeText);
          const venueInfo = parseVenue(venueText);
          
          events.push({
            artist: artistText || '未知藝人',
            title: titleText,
            eventDate: parsedDate,
            startTime: parsedTime.start || '19:00:00',
            endTime: parsedTime.end || '22:00:00',
            venueName: venueInfo.name || '未知場館',
            venueCity: venueInfo.city || '台北市',
            venueAddress: venueInfo.address || '',
            imageUrl: fullImageUrl,
            source: 'tixcraft',
            sourceUrl: fullUrl,
          });
        }
      } catch (error) {
        console.error(`處理 Tixcraft 活動項目時發生錯誤:`, error);
      }
    });
    
    console.log(`✅ Tixcraft 爬取完成，找到 ${events.length} 個活動`);
  } catch (error: any) {
    console.error('❌ 爬取 Tixcraft 時發生錯誤:', error.message);
  }
  
  return events;
}

/**
 * 爬取 KKTIX 活動列表
 */
async function scrapeKKTIX(): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];
  
  try {
    console.log('📡 開始爬取 KKTIX...');
    
    const url = 'https://kktix.com/events';
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    
    $('.event-item, .activity-item, [data-event-id]').each((index, element) => {
      try {
        const $el = $(element);
        
        const titleText = $el.find('.event-title, h3, [class*="title"]').first().text().trim();
        const artistText = $el.find('.organizer, [class*="organizer"]').first().text().trim() || titleText.split(' ')[0];
        const dateText = $el.find('.event-date, [class*="date"]').first().text().trim();
        const timeText = $el.find('.event-time, [class*="time"]').first().text().trim();
        const venueText = $el.find('.venue, [class*="venue"]').first().text().trim();
        
        // 嘗試提取圖片
        const imageUrl = $el.find('img').first().attr('src') || 
                        $el.find('img').first().attr('data-src') || 
                        undefined;
        const fullImageUrl = imageUrl?.startsWith('http') 
          ? imageUrl 
          : imageUrl 
            ? `https://kktix.com${imageUrl}` 
            : undefined;
        
        const link = $el.find('a').first().attr('href') || '';
        const fullUrl = link.startsWith('http') ? link : `https://kktix.com${link}`;
        
        if (titleText && dateText) {
          const parsedDate = parseDate(dateText);
          const parsedTime = parseTime(timeText);
          const venueInfo = parseVenue(venueText);
          
          events.push({
            artist: artistText || '未知藝人',
            title: titleText,
            eventDate: parsedDate,
            startTime: parsedTime.start || '19:00:00',
            endTime: parsedTime.end || '22:00:00',
            venueName: venueInfo.name || '未知場館',
            venueCity: venueInfo.city || '台北市',
            venueAddress: venueInfo.address || '',
            imageUrl: fullImageUrl,
            source: 'kktix',
            sourceUrl: fullUrl,
          });
        }
      } catch (error) {
        console.error(`處理 KKTIX 活動項目時發生錯誤:`, error);
      }
    });
    
    console.log(`✅ KKTIX 爬取完成，找到 ${events.length} 個活動`);
  } catch (error: any) {
    console.error('❌ 爬取 KKTIX 時發生錯誤:', error.message);
  }
  
  return events;
}

/**
 * 解析日期字串
 */
function parseDate(dateStr: string): string {
  const patterns = [
    /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/,
    /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/,
    /(\d{4})年(\d{1,2})月(\d{1,2})日/,
  ];
  
  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      let year, month, day;
      if (pattern === patterns[0] || pattern === patterns[2]) {
        [year, month, day] = match.slice(1);
      } else {
        [month, day, year] = match.slice(1);
      }
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 3);
  return futureDate.toISOString().split('T')[0];
}

/**
 * 解析時間字串
 */
function parseTime(timeStr: string): { start: string; end: string } {
  const timePattern = /(\d{1,2}):(\d{2})/g;
  const matches = [...timeStr.matchAll(timePattern)];
  
  if (matches.length >= 2) {
    return {
      start: `${matches[0][1].padStart(2, '0')}:${matches[0][2]}:00`,
      end: `${matches[1][1].padStart(2, '0')}:${matches[1][2]}:00`,
    };
  } else if (matches.length === 1) {
    const start = `${matches[0][1].padStart(2, '0')}:${matches[0][2]}:00`;
    const [hour] = start.split(':');
    const endHour = (parseInt(hour) + 3) % 24;
    return {
      start,
      end: `${endHour.toString().padStart(2, '0')}:${matches[0][2]}:00`,
    };
  }
  
  return { start: '19:00:00', end: '22:00:00' };
}

/**
 * 解析場館資訊
 */
function parseVenue(venueStr: string): { name: string; city: string; address: string } {
  const venueMap: Record<string, { name: string; city: string; address: string }> = {
    '小巨蛋': { name: '台北小巨蛋', city: '台北市', address: '台北市松山區南京東路四段2號' },
    '台北小巨蛋': { name: '台北小巨蛋', city: '台北市', address: '台北市松山區南京東路四段2號' },
    '高雄巨蛋': { name: '高雄巨蛋', city: '高雄市', address: '高雄市左營區博愛二路757號' },
    '台中洲際': { name: '台中洲際棒球場', city: '台中市', address: '台中市北屯區崇德路三段833號' },
    '桃園國際': { name: '桃園國際棒球場', city: '桃園市', address: '桃園市中壢區領航北路一段1號' },
  };
  
  for (const [key, value] of Object.entries(venueMap)) {
    if (venueStr.includes(key)) {
      return value;
    }
  }
  
  const cityMatch = venueStr.match(/(台北|新北|桃園|台中|台南|高雄|新竹|基隆|嘉義|屏東|花蓮|台東|宜蘭|苗栗|彰化|南投|雲林|澎湖|金門|連江)市?/);
  const city = cityMatch ? cityMatch[1] + '市' : '台北市';
  
  return {
    name: venueStr || '未知場館',
    city,
    address: '',
  };
}

/**
 * 根據場館獲取預設座位區域
 */
function getDefaultSeatZones(venueName: string): SeatZone[] {
  const zoneTemplates: Record<string, SeatZone[]> = {
    '台北小巨蛋': [
      { name: 'A1搖滾區', rowCount: 20, colCount: 30, notes: '最靠近舞台', priceRange: { min: 3800, max: 4500 } },
      { name: 'A2搖滾區', rowCount: 20, colCount: 30, notes: '舞台左側', priceRange: { min: 3500, max: 4200 } },
      { name: 'B區看台', rowCount: 30, colCount: 50, notes: '二樓看台區', priceRange: { min: 2800, max: 3200 } },
      { name: 'C區看台', rowCount: 30, colCount: 50, notes: '三樓看台區', priceRange: { min: 2000, max: 2500 } },
    ],
    '高雄巨蛋': [
      { name: 'VIP區', rowCount: 15, colCount: 25, notes: '最前排貴賓區', priceRange: { min: 5500, max: 6500 } },
      { name: '紅區', rowCount: 25, colCount: 40, notes: '一樓座位區', priceRange: { min: 3800, max: 4500 } },
      { name: '藍區', rowCount: 30, colCount: 45, notes: '二樓座位區', priceRange: { min: 2800, max: 3500 } },
      { name: '綠區', rowCount: 25, colCount: 40, notes: '三樓座位區', priceRange: { min: 1800, max: 2500 } },
    ],
    '台中洲際棒球場': [
      { name: '內野搖滾區', rowCount: 30, colCount: 50, notes: '最靠近舞台', priceRange: { min: 3500, max: 4200 } },
      { name: '內野看台', rowCount: 40, colCount: 60, notes: '內野看台區', priceRange: { min: 2500, max: 3000 } },
      { name: '外野看台', rowCount: 50, colCount: 80, notes: '外野看台區', priceRange: { min: 1500, max: 2000 } },
    ],
    '桃園國際棒球場': [
      { name: '內野搖滾區', rowCount: 30, colCount: 50, notes: '最靠近舞台', priceRange: { min: 3500, max: 4200 } },
      { name: '內野看台', rowCount: 40, colCount: 60, notes: '內野看台區', priceRange: { min: 2500, max: 3000 } },
      { name: '外野看台', rowCount: 50, colCount: 80, notes: '外野看台區', priceRange: { min: 1500, max: 2000 } },
    ],
  };
  
  for (const [key, zones] of Object.entries(zoneTemplates)) {
    if (venueName.includes(key)) {
      return zones;
    }
  }
  
  // 預設座位區域
  return [
    { name: '搖滾區', rowCount: 25, colCount: 40, notes: '最靠近舞台', priceRange: { min: 3500, max: 4500 } },
    { name: '看台區', rowCount: 30, colCount: 50, notes: '看台座位', priceRange: { min: 2000, max: 3000 } },
  ];
}

/**
 * 將爬取的活動資料匯入資料庫
 */
async function importEventsToDatabase(events: ScrapedEvent[]): Promise<void> {
  console.log('\n📊 開始匯入活動資料到資料庫...');
  
  // 先更新 event 表，添加 image_url 欄位（如果不存在）
  try {
    await pool.query(`
      ALTER TABLE event 
      ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)
    `);
    console.log('✅ 確認 event 表包含 image_url 欄位');
  } catch (error: any) {
    // 欄位可能已存在，忽略錯誤
  }
  
  let imported = 0;
  let skipped = 0;
  
  for (const event of events) {
    try {
      await pool.query('BEGIN');
      
      // 檢查場館是否存在，不存在則建立
      let venueResult = await pool.query(
        'SELECT venue_id FROM venue WHERE name = $1 AND city = $2',
        [event.venueName, event.venueCity]
      );
      
      let venueId: number;
      if (venueResult.rows.length === 0) {
        const newVenue = await pool.query(
          'INSERT INTO venue (name, city, address) VALUES ($1, $2, $3) RETURNING venue_id',
          [event.venueName, event.venueCity, event.venueAddress]
        );
        venueId = newVenue.rows[0].venue_id;
        console.log(`  ✅ 建立新場館: ${event.venueName}`);
        
        // 為新場館建立預設座位區域
        const seatZones = getDefaultSeatZones(event.venueName);
        for (const zone of seatZones) {
          await pool.query(
            `INSERT INTO seat_zone (venue_id, name, row_count, col_count, notes)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT DO NOTHING`,
            [venueId, zone.name, zone.rowCount, zone.colCount, zone.notes]
          );
        }
      } else {
        venueId = venueResult.rows[0].venue_id;
      }
      
      // 檢查活動是否已存在
      const existingEvent = await pool.query(
        'SELECT event_id FROM event WHERE title = $1 AND event_date = $2 AND venue_id = $3',
        [event.title, event.eventDate, venueId]
      );
      
      if (existingEvent.rows.length > 0) {
        console.log(`  ⏭️  活動已存在，跳過: ${event.title}`);
        skipped++;
        await pool.query('ROLLBACK');
        continue;
      }
      
      // 建立活動（包含圖片 URL）
      const eventResult = await pool.query(
        `INSERT INTO event (venue_id, artist, title, event_date, start_time, end_time, status, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, 'Scheduled', $7)
         RETURNING event_id`,
        [venueId, event.artist, event.title, event.eventDate, event.startTime, event.endTime, event.imageUrl || null]
      );
      
      const eventId = eventResult.rows[0].event_id;
      
      // 建立座位區域（如果活動有指定）
      const seatZones = event.seatZones || getDefaultSeatZones(event.venueName);
      for (const zone of seatZones) {
        // 檢查座位區域是否已存在
        const existingZone = await pool.query(
          'SELECT zone_id FROM seat_zone WHERE venue_id = $1 AND name = $2',
          [venueId, zone.name]
        );
        
        let zoneId: number;
        if (existingZone.rows.length === 0) {
          const newZone = await pool.query(
            `INSERT INTO seat_zone (venue_id, name, row_count, col_count, notes)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING zone_id`,
            [venueId, zone.name, zone.rowCount, zone.colCount, zone.notes]
          );
          zoneId = newZone.rows[0].zone_id;
        } else {
          zoneId = existingZone.rows[0].zone_id;
        }
        
        // 建立一些範例票券（每個區域建立 5-10 張票）
        const ticketCount = Math.floor(Math.random() * 6) + 5;
        for (let i = 0; i < ticketCount; i++) {
          const row = Math.floor(Math.random() * zone.rowCount) + 1;
          const col = Math.floor(Math.random() * zone.colCount) + 1;
          const seatLabel = `${zone.name.substring(0, 2)}-${row}-${col}`;
          const faceValue = zone.priceRange.min + 
            Math.floor(Math.random() * (zone.priceRange.max - zone.priceRange.min));
          
          // 產生唯一的序號
          const serialNo = `TKT-${eventId}-${zoneId}-${Date.now()}-${i}`;
          
          try {
            await pool.query(
              `INSERT INTO ticket (event_id, zone_id, seat_label, face_value, original_vendor, serial_no, status)
               VALUES ($1, $2, $3, $4, $5, $6, 'Valid')`,
              [eventId, zoneId, seatLabel, faceValue, event.source === 'tixcraft' ? '拓元售票' : 'KKTIX', serialNo]
            );
          } catch (error: any) {
            // 如果序號重複，跳過這張票
            if (error.code === '23505') {
              continue;
            }
            throw error;
          }
        }
      }
      
      await pool.query('COMMIT');
      imported++;
      console.log(`  ✅ 匯入活動: ${event.artist} - ${event.title}`);
      if (event.imageUrl) {
        console.log(`     📷 圖片: ${event.imageUrl}`);
      }
      
      await delay(100);
    } catch (error: any) {
      await pool.query('ROLLBACK');
      console.error(`  ❌ 匯入活動失敗: ${event.title}`, error.message);
    }
  }
  
  console.log(`\n📊 匯入完成: ${imported} 個活動已匯入, ${skipped} 個活動已跳過`);
}

/**
 * 從 JSON 檔案讀取範例活動資料
 */
function loadExampleEvents(): ScrapedEvent[] {
  const exampleEvents: ScrapedEvent[] = [
    {
      artist: '五月天',
      title: '2025 五月天 [回到那一天] 25週年 巡迴演唱會 台北站',
      eventDate: '2025-06-15',
      startTime: '19:30:00',
      endTime: '22:30:00',
      venueName: '台北小巨蛋',
      venueCity: '台北市',
      venueAddress: '台北市松山區南京東路四段2號',
      imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
      source: 'tixcraft',
      sourceUrl: 'https://tixcraft.com/activity/detail/example1',
    },
    {
      artist: '蔡依林',
      title: 'JOLIN 蔡依林 2025 世界巡迴演唱會 高雄站',
      eventDate: '2025-07-20',
      startTime: '19:00:00',
      endTime: '22:00:00',
      venueName: '高雄巨蛋',
      venueCity: '高雄市',
      venueAddress: '高雄市左營區博愛二路757號',
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
      source: 'kktix',
      sourceUrl: 'https://kktix.com/events/example1',
    },
    {
      artist: '周杰倫',
      title: '周杰倫 2025 嘉年華世界巡迴演唱會 台中站',
      eventDate: '2025-08-10',
      startTime: '19:30:00',
      endTime: '22:30:00',
      venueName: '台中洲際棒球場',
      venueCity: '台中市',
      venueAddress: '台中市北屯區崇德路三段833號',
      imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
      source: 'tixcraft',
      sourceUrl: 'https://tixcraft.com/activity/detail/example2',
    },
    {
      artist: '田馥甄',
      title: '田馥甄 2025 演唱會 台北站',
      eventDate: '2025-09-05',
      startTime: '19:00:00',
      endTime: '21:30:00',
      venueName: '台北小巨蛋',
      venueCity: '台北市',
      venueAddress: '台北市松山區南京東路四段2號',
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
      source: 'kktix',
      sourceUrl: 'https://kktix.com/events/example2',
    },
    {
      artist: '張惠妹',
      title: 'aMEI 張惠妹 2025 世界巡迴演唱會 桃園站',
      eventDate: '2025-10-15',
      startTime: '19:30:00',
      endTime: '22:30:00',
      venueName: '桃園國際棒球場',
      venueCity: '桃園市',
      venueAddress: '桃園市中壢區領航北路一段1號',
      imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
      source: 'tixcraft',
      sourceUrl: 'https://tixcraft.com/activity/detail/example3',
    },
    {
      artist: '林俊傑',
      title: 'JJ 林俊傑 2025 JJ20 世界巡迴演唱會 台北站',
      eventDate: '2025-11-08',
      startTime: '19:00:00',
      endTime: '22:00:00',
      venueName: '台北小巨蛋',
      venueCity: '台北市',
      venueAddress: '台北市松山區南京東路四段2號',
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
      source: 'kktix',
      sourceUrl: 'https://kktix.com/events/example3',
    },
    {
      artist: 'BLACKPINK',
      title: 'BLACKPINK 2025 World Tour [Born Pink] 台北站',
      eventDate: '2025-12-20',
      startTime: '18:30:00',
      endTime: '21:30:00',
      venueName: '台北小巨蛋',
      venueCity: '台北市',
      venueAddress: '台北市松山區南京東路四段2號',
      imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
      source: 'tixcraft',
      sourceUrl: 'https://tixcraft.com/activity/detail/example4',
    },
    {
      artist: '鄧紫棋',
      title: 'G.E.M. 鄧紫棋 2025 世界巡迴演唱會 高雄站',
      eventDate: '2026-01-12',
      startTime: '19:30:00',
      endTime: '22:30:00',
      venueName: '高雄巨蛋',
      venueCity: '高雄市',
      venueAddress: '高雄市左營區博愛二路757號',
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
      source: 'kktix',
      sourceUrl: 'https://kktix.com/events/example4',
    },
    {
      artist: '蕭敬騰',
      title: '蕭敬騰 2025 世界巡迴演唱會 台中站',
      eventDate: '2026-02-14',
      startTime: '19:00:00',
      endTime: '22:00:00',
      venueName: '台中洲際棒球場',
      venueCity: '台中市',
      venueAddress: '台中市北屯區崇德路三段833號',
      imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
      source: 'tixcraft',
      sourceUrl: 'https://tixcraft.com/activity/detail/example5',
    },
    {
      artist: 'A-Lin',
      title: 'A-Lin 2025 世界巡迴演唱會 台北站',
      eventDate: '2026-03-08',
      startTime: '19:30:00',
      endTime: '22:00:00',
      venueName: '台北小巨蛋',
      venueCity: '台北市',
      venueAddress: '台北市松山區南京東路四段2號',
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
      source: 'kktix',
      sourceUrl: 'https://kktix.com/events/example5',
    },
    {
      artist: '李榮浩',
      title: '李榮浩 2025 世界巡迴演唱會 桃園站',
      eventDate: '2026-04-20',
      startTime: '19:00:00',
      endTime: '22:00:00',
      venueName: '桃園國際棒球場',
      venueCity: '桃園市',
      venueAddress: '桃園市中壢區領航北路一段1號',
      imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
      source: 'tixcraft',
      sourceUrl: 'https://tixcraft.com/activity/detail/example6',
    },
    {
      artist: '陳奕迅',
      title: 'Eason 陳奕迅 2025 Fear and Dreams 世界巡迴演唱會 台北站',
      eventDate: '2026-05-15',
      startTime: '19:30:00',
      endTime: '22:30:00',
      venueName: '台北小巨蛋',
      venueCity: '台北市',
      venueAddress: '台北市松山區南京東路四段2號',
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
      source: 'kktix',
      sourceUrl: 'https://kktix.com/events/example6',
    },
    {
      artist: '告五人',
      title: '告五人 2025 世界巡迴演唱會 高雄站',
      eventDate: '2026-06-10',
      startTime: '19:00:00',
      endTime: '21:30:00',
      venueName: '高雄巨蛋',
      venueCity: '高雄市',
      venueAddress: '高雄市左營區博愛二路757號',
      imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
      source: 'tixcraft',
      sourceUrl: 'https://tixcraft.com/activity/detail/example7',
    },
    {
      artist: '盧廣仲',
      title: '盧廣仲 2025 世界巡迴演唱會 台中站',
      eventDate: '2026-07-22',
      startTime: '19:30:00',
      endTime: '22:00:00',
      venueName: '台中洲際棒球場',
      venueCity: '台中市',
      venueAddress: '台中市北屯區崇德路三段833號',
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
      source: 'kktix',
      sourceUrl: 'https://kktix.com/events/example7',
    },
    {
      artist: '蘇打綠',
      title: '蘇打綠 2025 復刻演唱會 台北站',
      eventDate: '2026-08-18',
      startTime: '19:00:00',
      endTime: '22:00:00',
      venueName: '台北小巨蛋',
      venueCity: '台北市',
      venueAddress: '台北市松山區南京東路四段2號',
      imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
      source: 'tixcraft',
      sourceUrl: 'https://tixcraft.com/activity/detail/example8',
    },
  ];
  
  return exampleEvents;
}

/**
 * 主函數
 */
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        網頁爬蟲 - 爬取活動資訊                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  const useScraping = process.env.ENABLE_SCRAPING === 'true';
  let allEvents: ScrapedEvent[] = [];
  
  try {
    if (useScraping) {
      console.log('🌐 啟用網頁爬蟲模式...\n');
      const [tixcraftEvents, kktixEvents] = await Promise.all([
        scrapeTixcraft(),
        scrapeKKTIX(),
      ]);
      allEvents = [...tixcraftEvents, ...kktixEvents];
    } else {
      console.log('📋 使用範例資料模式（設定 ENABLE_SCRAPING=true 啟用實際爬蟲）\n');
      allEvents = loadExampleEvents();
    }
    
    const uniqueEvents = Array.from(
      new Map(allEvents.map((e) => [`${e.title}-${e.eventDate}`, e])).values()
    );
    
    console.log(`📋 總共找到 ${uniqueEvents.length} 個不重複的活動\n`);
    
    uniqueEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.artist} - ${event.title}`);
      console.log(`   日期: ${event.eventDate} ${event.startTime}`);
      console.log(`   場館: ${event.venueName} (${event.venueCity})`);
      if (event.imageUrl) {
        console.log(`   圖片: ${event.imageUrl}`);
      }
    });
    
    await importEventsToDatabase(uniqueEvents);
    
    console.log('\n🎉 爬蟲任務完成！');
    console.log('\n📝 注意事項：');
    console.log('   - 座位號碼（如 A1-12-18）通常無法從公開頁面獲取');
    console.log('   - 已自動建立座位區域和範例票券資料');
    console.log('   - 圖片 URL 使用 Unsplash 範例圖片（實際爬取時會使用網站圖片）');
  } catch (error) {
    console.error('❌ 執行爬蟲時發生錯誤:', error);
    console.log('\n⚠️  使用範例資料作為後備...');
    const exampleEvents = loadExampleEvents();
    await importEventsToDatabase(exampleEvents);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// 執行主函數
main();
