import dotenv from 'dotenv';
import pg from 'pg';

// 確保環境變數已載入
dotenv.config();

const { Pool } = pg;

// =====================================================
// PostgreSQL (Neon) 連線配置
// =====================================================
// 優先使用連接字串（Neon 提供），否則使用個別參數
const pgConfig = process.env.NEON_DATABASE_URL
  ? {
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Neon 需要 SSL
      },
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'encore',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };

const pool = new Pool(pgConfig);

pool.on('connect', () => {
  console.log('✅ PostgreSQL (Neon) 連線成功');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL 連線錯誤:', err);
});

// 導出 PostgreSQL pool
export default pool;

