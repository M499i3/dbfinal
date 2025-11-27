import dotenv from 'dotenv';
import { MongoClient, Db } from 'mongodb';

// 確保環境變數已載入
dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const mongoDbName = process.env.MONGODB_DB_NAME || 'encore';

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

/**
 * 初始化 MongoDB 連線
 * @returns MongoDB 資料庫實例
 */
export async function connectMongoDB(): Promise<Db> {
  if (mongoDb) {
    return mongoDb;
  }

  try {
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    mongoDb = mongoClient.db(mongoDbName);
    console.log('✅ MongoDB 連線成功');
    return mongoDb;
  } catch (error) {
    console.error('❌ MongoDB 連線錯誤:', error);
    throw error;
  }
}

/**
 * 關閉 MongoDB 連線
 */
export async function closeMongoDB(): Promise<void> {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    mongoDb = null;
    console.log('MongoDB 連線已關閉');
  }
}

/**
 * 取得 MongoDB 資料庫實例（如果已連線）
 * @returns MongoDB 資料庫實例或 null
 */
export function getMongoDB(): Db | null {
  return mongoDb;
}

/**
 * 檢查 MongoDB 連線狀態
 * @returns 是否已連線
 */
export function isMongoDBConnected(): boolean {
  return mongoDb !== null && mongoClient !== null;
}

