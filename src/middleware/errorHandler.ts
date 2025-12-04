import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // Basic normalized error response
  const e = err as { status?: number; code?: string; message?: string; details?: unknown };
  const status = e?.status || 500;
  const code = e?.code || 'internal_error';
  const message = e?.message || 'Internal server error';
  res.status(status).json({ error: { code, message, details: e?.details || null } });
}
