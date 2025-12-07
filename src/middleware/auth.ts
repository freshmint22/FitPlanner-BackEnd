import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

type UserPayload = Record<string, unknown> & { rol?: string };

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');

export const requireAuth = async (req: Request & { user?: UserPayload }, res: Response, next: NextFunction) => {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: { code: 'unauth', message: 'No token' } });
  const token = h.replace('Bearer ', '');

  // Dynamically import `jose` and verify token (works in ESM runtime).
  try {
    const { jwtVerify } = await import('jose');
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    req.user = payload as UserPayload;
    return next();
  } catch (e) {
    // If jose verification fails (or ESM issues), try a manual HS256 verification
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('invalid');
      const [headerB64, payloadB64, sigB64] = parts;
      const header = JSON.parse(Buffer.from(headerB64, 'base64').toString('utf8'));
      if (header.alg !== 'HS256') throw new Error('unsupported alg');
      const data = `${headerB64}.${payloadB64}`;
      // compute HMAC-SHA256
      const secretStr = process.env.JWT_SECRET || 'dev-secret';
      const sig = crypto.createHmac('sha256', secretStr).update(data).digest('base64');
      const sigB64Computed = sig.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      if (sigB64 !== sigB64Computed) throw new Error('invalid signature');
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
      req.user = payload as UserPayload;
      return next();
    } catch (e2) {
      return res.status(401).json({ error: { code: 'unauth', message: 'Invalid token' } });
    }
  }
};
