import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

// 通用註冊函數（內部使用）
const registerWithRole = async (
  name: string,
  email: string,
  phone: string,
  password: string,
  role: 'User' | 'BusinessOperator'
): Promise<{ user: any; token: string }> => {
    // 檢查 email 是否已存在
    const existingUser = await pool.query(
      'SELECT user_id FROM "user" WHERE email = $1 OR phone = $2',
      [email, phone]
    );

    if (existingUser.rows.length > 0) {
    throw new Error('此電子郵件或電話號碼已被註冊');
    }

    // 加密密碼
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 建立使用者
    const result = await pool.query(
      `INSERT INTO "user" (name, email, phone, password_hash, kyc_level)
       VALUES ($1, $2, $3, $4, 0)
       RETURNING user_id, name, email, phone, kyc_level, created_at`,
      [name, email, phone, passwordHash]
    );

    const newUser = result.rows[0];

  // 為新使用者添加角色
  await pool.query('INSERT INTO user_role (user_id, role) VALUES ($1, $2)', [
    newUser.user_id,
    role,
  ]);

    // 生成 JWT
    const token = jwt.sign(
    { userId: newUser.user_id, email: newUser.email, roles: [role] },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

  return {
      user: {
        userId: newUser.user_id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        kycLevel: newUser.kyc_level,
        createdAt: newUser.created_at,
      roles: [role],
      },
    token,
  };
};

// 一般使用者註冊
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { name, email, phone, password } = req.body;

  try {
    const { user, token } = await registerWithRole(name, email, phone, password, 'User');

    res.status(201).json({
      message: '註冊成功',
      user,
      token,
    });
  } catch (error: any) {
    console.error('註冊錯誤:', error);
    res.status(400).json({ error: error.message || '伺服器錯誤' });
  }
};

// 業務經營者註冊
export const registerBusinessOperator = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name, email, phone, password } = req.body;

  try {
    const { user, token } = await registerWithRole(
      name,
      email,
      phone,
      password,
      'BusinessOperator'
    );

    res.status(201).json({
      message: '業務經營者註冊成功',
      user,
      token,
    });
  } catch (error: any) {
    console.error('註冊錯誤:', error);
    res.status(400).json({ error: error.message || '伺服器錯誤' });
  }
};

// 保留原有註冊端點（向後兼容，預設為 User）
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, phone, password, role } = req.body;
  const userRole: 'User' | 'BusinessOperator' =
    role === 'BusinessOperator' ? 'BusinessOperator' : 'User';

  try {
    const { user, token } = await registerWithRole(name, email, phone, password, userRole);

    res.status(201).json({
      message: '註冊成功',
      user,
      token,
    });
  } catch (error: any) {
    console.error('註冊錯誤:', error);
    res.status(400).json({ error: error.message || '伺服器錯誤' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // 查詢使用者
    const userResult = await pool.query(
      'SELECT user_id, name, email, phone, password_hash, kyc_level FROM "user" WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({ error: '電子郵件或密碼錯誤' });
      return;
    }

    const user = userResult.rows[0];

    // 驗證密碼
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: '電子郵件或密碼錯誤' });
      return;
    }

    // 檢查是否在黑名單中
    const blacklistCheck = await pool.query(
      'SELECT user_id FROM blacklist WHERE user_id = $1',
      [user.user_id]
    );

    if (blacklistCheck.rows.length > 0) {
      res.status(403).json({ error: '您的帳號已被停權，請聯繫客服' });
      return;
    }

    // 獲取使用者角色
    const rolesResult = await pool.query(
      'SELECT role FROM user_role WHERE user_id = $1',
      [user.user_id]
    );
    const roles = rolesResult.rows.map((r) => r.role);

    // 生成 JWT
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, roles },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 記錄登入風險事件
    // 注意：Login 類型的 ref_id 使用 user_id 作為參考
    await pool.query(
      'INSERT INTO risk_event (user_id, type, level, ref_id) VALUES ($1, $2, $3, $4)',
      [user.user_id, 'Login', 1, user.user_id]
    );

    res.json({
      message: '登入成功',
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        kycLevel: user.kyc_level,
        roles,
      },
      token,
    });
  } catch (error) {
    console.error('登入錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.userId;

  try {
    const result = await pool.query(
      `SELECT u.user_id, u.name, u.email, u.phone, u.kyc_level, u.created_at,
              array_agg(ur.role) as roles
       FROM "user" u
       LEFT JOIN user_role ur ON u.user_id = ur.user_id
       WHERE u.user_id = $1
       GROUP BY u.user_id`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: '使用者不存在' });
      return;
    }

    const user = result.rows[0];
    res.json({
      userId: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      kycLevel: user.kyc_level,
      createdAt: user.created_at,
      roles: user.roles.filter(Boolean),
    });
  } catch (error) {
    console.error('獲取個人資料錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

