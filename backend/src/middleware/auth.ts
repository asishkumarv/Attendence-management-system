import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: Role;
    email: string;
  };
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  verifyToken(req, res, () => {
    if (req.user?.role !== Role.ADMIN) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
  });
};
