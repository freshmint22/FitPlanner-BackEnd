import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

// ------------------------------
// 1. Definir UserPayload TIPADO
// ------------------------------
export interface UserPayload {
  id: string;
  email?: string;
  rol?: string;
  [key: string]: unknown; // por si el JWT trae más cosas (no usamos `any`)
}

const getSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');

// ----------------------------------------------------------
// Middleware requireAuth — verifica el token y agrega req.user
// ----------------------------------------------------------
export const requireAuth = async (
  req: Request & { user?: UserPayload },
  res: Response,
  next: NextFunction
) => {
  const h = req.headers.authorization;
  if (!h) {
    return res.status(401).json({
      error: { code: 'unauth', message: 'No token' }
    });
  }

  const token = h.replace('Bearer ', '');

  // --------------------------------------------
  // 1er intento: Validar con jose (modo seguro moderno)
  // --------------------------------------------
  try {
    const { jwtVerify } = await import('jose');
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256']
    });

    req.user = payload as UserPayload;
    return next();
  } catch {
    // --------------------------------------------
    // 2do intento: Validación manual HS256 (fallback)
    // --------------------------------------------
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('invalid');

      const [headerB64, payloadB64, sigB64] = parts;

      const header = JSON.parse(
        Buffer.from(headerB64, 'base64').toString('utf8')
      );
      if (header.alg !== 'HS256') throw new Error('unsupported alg');

      const data = `${headerB64}.${payloadB64}`;

      // Firmar nuevamente con el secreto
      const secretStr = process.env.JWT_SECRET || 'dev-secret';
      const sig = crypto
        .createHmac('sha256', secretStr)
        .update(data)
        .digest('base64');

      const sigB64Computed = sig
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      if (sigB64 !== sigB64Computed) throw new Error('invalid signature');

      // Si la firma coincide → el token es válido
      const payload = JSON.parse(
        Buffer.from(payloadB64, 'base64').toString('utf8')
      );

      req.user = payload as UserPayload;
      return next();
    } catch {
      return res.status(401).json({
        error: { code: 'unauth', message: 'Invalid token' }
      });
    }
  }
};

// ----------------------------------------------------------
// Middlewares adicionales: validarJWT y isAdmin
// ----------------------------------------------------------

export const validarJWT = requireAuth;

export const isAdmin = (
  req: Request & { user?: UserPayload },
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.rol !== "admin") {
    return res.status(403).json({
      ok: false,
      msg: "No autorizado — solo administradores"
    });
  }

  next();
};
