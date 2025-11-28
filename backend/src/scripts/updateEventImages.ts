/**
 * 更新活動圖片 URL
 */

import dotenv from 'dotenv';
dotenv.config();

import pool from '../config/database.js';

async function updateEventImages() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        更新活動圖片 URL                                ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const imageUpdates: Array<{ eventId: number; imageUrl: string }> = [
    { eventId: 1, imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80' },
    { eventId: 2, imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80' },
    { eventId: 3, imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80' },
    { eventId: 4, imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80' },
    { eventId: 5, imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80' },
  ];

  let updated = 0;

  for (const update of imageUpdates) {
    try {
      await pool.query(
        'UPDATE event SET image_url = $1 WHERE event_id = $2',
        [update.imageUrl, update.eventId]
      );
      updated++;
      console.log(`✅ 更新活動 #${update.eventId} 的圖片 URL`);
    } catch (error: any) {
      console.error(`❌ 更新活動 #${update.eventId} 失敗:`, error.message);
    }
  }

  console.log(`\n📊 更新完成: ${updated} 個活動已更新圖片 URL`);
  await pool.end();
  process.exit(0);
}

updateEventImages().catch((error) => {
  console.error('更新圖片時發生錯誤:', error);
  process.exit(1);
});

