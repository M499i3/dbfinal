/**
 * 真實網頁爬蟲腳本 - 從實際網站爬取活動資訊
 * 
 * 注意：這個腳本需要根據實際網站結構調整選擇器
 * 由於網站可能有反爬蟲機制，建議：
 * 1. 使用 Puppeteer 模擬瀏覽器
 * 2. 設定適當的延遲
 * 3. 遵守網站的 robots.txt 和服務條款
 */

import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import * as cheerio from 'cheerio';
import pool from '../config/database.js';

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
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 爬取 Tixcraft 活動列表（改進版）
 */
async function scrapeTixcraftReal(): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];
  
  try {
    console.log('📡 開始爬取 Tixcraft（真實資料）...');
    
    // Tixcraft 的實際 URL 可能需要調整
    const url = 'https://tixcraft.com/activity';
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        'Referer': 'https://tixcraft.com/',
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    console.log(`📄 頁面狀態碼: ${response.status}`);
    console.log(`📄 頁面大小: ${response.data.length} bytes`);

    const $ = cheerio.load(response.data);
    
    // 嘗試多種可能的選擇器
    const selectors = [
      '.activity-list .activity-item',
      '.event-list .event-item',
      '[class*="activity"]',
      '[class*="event"]',
      '.list-item',
    ];
    
    let found = false;
    for (const selector of selectors) {
      const elements = $(selector);
      console.log(`🔍 嘗試選擇器 "${selector}": 找到 ${elements.length} 個元素`);
      
      if (elements.length > 0) {
        found = true;
        elements.each((index, element) => {
          try {
            const $el = $(element);
            
            // 嘗試提取各種可能的資訊
            const titleText = $el.find('h3, h2, .title, [class*="title"]').first().text().trim();
            const link = $el.find('a').first().attr('href') || '';
            
            if (titleText && link) {
              console.log(`  📋 找到活動: ${titleText.substring(0, 50)}...`);
              
              // 這裡需要根據實際 HTML 結構調整
              events.push({
                artist: titleText.split(' ')[0] || '未知藝人',
                title: titleText,
                eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30天後
                startTime: '19:00:00',
                endTime: '22:00:00',
                venueName: '待確認',
                venueCity: '台北市',
                venueAddress: '',
                imageUrl: $el.find('img').first().attr('src'),
                source: 'tixcraft',
                sourceUrl: link.startsWith('http') ? link : `https://tixcraft.com${link}`,
              });
            }
          } catch (error) {
            console.error(`處理項目時發生錯誤:`, error);
          }
        });
        break;
      }
    }
    
    if (!found) {
      console.log('⚠️  無法找到活動元素，網站結構可能已變動');
      console.log('💡 建議：');
      console.log('   1. 檢查網站 HTML 結構');
      console.log('   2. 使用瀏覽器開發者工具查看實際的 CSS 選擇器');
      console.log('   3. 考慮使用 Puppeteer 模擬瀏覽器');
    }
    
    console.log(`✅ Tixcraft 爬取完成，找到 ${events.length} 個活動`);
  } catch (error: any) {
    console.error('❌ 爬取 Tixcraft 時發生錯誤:', error.message);
    if (error.response) {
      console.error(`   狀態碼: ${error.response.status}`);
      console.error(`   回應標頭:`, error.response.headers);
    }
  }
  
  return events;
}

/**
 * 主函數
 */
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        真實網頁爬蟲 - 從實際網站爬取活動資訊          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  console.log('⚠️  注意：這個腳本會嘗試從實際網站爬取資料');
  console.log('⚠️  請確保遵守網站的服務條款和使用規範\n');
  
  try {
    const events = await scrapeTixcraftReal();
    
    if (events.length === 0) {
      console.log('\n❌ 沒有找到任何活動');
      console.log('\n可能的原因：');
      console.log('1. 網站有反爬蟲機制（403/429 錯誤）');
      console.log('2. 網站結構已變動，選擇器不正確');
      console.log('3. 需要登入或驗證才能查看活動');
      console.log('\n建議解決方案：');
      console.log('1. 使用 Puppeteer 模擬真實瀏覽器');
      console.log('2. 手動檢查網站 HTML 結構並更新選擇器');
      console.log('3. 考慮使用官方 API（如果有提供）');
      console.log('4. 手動輸入真實活動資料');
    } else {
      console.log(`\n📋 找到 ${events.length} 個活動`);
      events.forEach((event, index) => {
        console.log(`${index + 1}. ${event.artist} - ${event.title}`);
      });
    }
  } catch (error) {
    console.error('❌ 執行爬蟲時發生錯誤:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();

