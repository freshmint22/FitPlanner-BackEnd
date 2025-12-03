import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: { code: 'unauth', message: 'No token' } });
  const token = h.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    (req as any).user = payload;
    next();
  } catch (e) {
    res.status(401).json({ error: { code: 'unauth', message: 'Invalid token' } });
  }
};
