import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Basic normalized error response
  const status = err?.status || 500;
  const code = err?.code || 'internal_error';
  const message = err?.message || 'Internal server error';
  res.status(status).json({ error: { code, message, details: err?.details || null } });
}
