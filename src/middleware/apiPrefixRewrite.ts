import { Request, Response, NextFunction } from 'express';

// Routes that in older frontend versions may be called without the /api prefix.
const LEGACY_API_ROUTES = [
  '/attendances',
  '/routines',
  '/users',
  '/members',
  '/classes',
  '/reportes',
  '/pagos',
  '/notifications',
  '/gyminfo',
  '/planes',
  '/auth',
  '/reportes'
];

export default function apiPrefixRewrite(req: Request, _res: Response, next: NextFunction) {
  try {
    const path = req.path || '';
    // If already under /api, nothing to do
    if (path.startsWith('/api/')) return next();

    // If request matches a legacy API route, rewrite to /api/<route>
    const matched = LEGACY_API_ROUTES.find((r) => path === r || path.startsWith(r + '/'));
    if (matched) {
      req.url = '/api' + req.url;
    }
  } catch (e) {
    // ignore rewrite errors and continue
  }
  return next();
}
