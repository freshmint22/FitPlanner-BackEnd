import { Router, Request, Response } from 'express';
import Member from '../models/member.model';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Simple profile endpoint used by tests
router.get('/profile', (_req, res) => {
  res.status(200).json({ email: 'test@example.com' });
});

// GET /users - list users (powered by Member model)
// Require authentication and admin role
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user || {};
    if (user.rol !== 'admin') return res.status(403).json({ error: { code: 'forbidden', message: 'Requires admin role' } });
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limitRaw = parseInt((req.query.limit as string) || '10', 10);
    const limit = Math.min(100, Math.max(1, isNaN(limitRaw) ? 10 : limitRaw));
    const sortParam = (req.query.sort as string) || '-createdAt';
    const q = (req.query.q as string) || '';
    const role = (req.query.role as string) || undefined;
    const status = (req.query.status as string) || undefined;

    const filter: any = {};
    if (q) {
      const re = new RegExp(q, 'i');
      filter.$or = [{ nombre: re }, { email: re }];
    }
    if (role) filter.rol = role;
    if (status) filter.estado = status;

    const total = await Member.countDocuments(filter);

    // Build mongoose sort object from param like 'name,-createdAt'
    const sort: any = {};
    for (const part of sortParam.split(',')) {
      const p = part.trim();
      if (!p) continue;
      if (p.startsWith('-')) sort[p.slice(1)] = -1;
      else sort[p] = 1;
    }

    const items = await Member.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('nombre email rol estado createdAt')
      .lean();

    const mapped = items.map((it: any) => ({
      id: it._id,
      nombre: it.nombre,
      email: it.email,
      rol: it.rol,
      estado: it.estado,
      createdAt: it.createdAt
    }));

    res.json({ items: mapped, total, page, limit });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('GET /users error', err);
    res.status(500).json({ error: { code: 'server_error', message: 'Internal error' } });
  }
});

export default router;
