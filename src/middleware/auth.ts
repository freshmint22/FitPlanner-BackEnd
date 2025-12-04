import { Request, Response, NextFunction } from 'express';

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: { code: 'unauth', message: 'No token' } });
  const token = h.replace('Bearer ', '');

  // In test environment use jsonwebtoken (CJS) to avoid Jest ESM issues
  if (process.env.NODE_ENV === 'test') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jwt = require('jsonwebtoken');
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      (req as any).user = payload;
      return next();
    } catch (e) {
      return res.status(401).json({ error: { code: 'unauth', message: 'Invalid token' } });
    }
  }

  // In non-test env load jose dynamically (ESM) and verify token
  try {
    const { jwtVerify } = await import('jose');
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    (req as any).user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: { code: 'unauth', message: 'Invalid token' } });
  }
};
