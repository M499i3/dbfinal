import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    roles: string[];
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未提供認證令牌' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as {
      userId: number;
      email: string;
      roles: string[];
    };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: '無效的認證令牌' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user?.roles.includes('Admin')) {
    res.status(403).json({ error: '需要管理員權限' });
    return;
  }
  next();
};

export const requireBusinessOperator = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user?.roles.includes('BusinessOperator') && !req.user?.roles.includes('Admin')) {
    res.status(403).json({ error: '需要業務經營者權限' });
    return;
  }
  next();
};

export const requireUser = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user?.roles.includes('User') && !req.user?.roles.includes('BusinessOperator') && !req.user?.roles.includes('Admin')) {
    res.status(403).json({ error: '需要使用者權限' });
    return;
  }
  next();
};

