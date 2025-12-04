import { Router, Request, Response } from 'express';
import Member, { IMember } from '../models/member.model';
import type { FilterQuery } from 'mongoose';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Simple profile endpoint used by tests
router.get('/profile', (_req, res) => {
  res.status(200).json({ email: 'test@example.com' });
});

// GET /users - list users (powered by Member model)
// Require authentication and admin role
function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/', requireAuth, async (req: Request & { user?: { rol?: string } }, res: Response) => {
  try {
    const user = req.user || {};
    if (user.rol !== 'admin') return res.status(403).json({ error: { code: 'forbidden', message: 'Requires admin role' } });
    // Validate and normalize query parameters
    const rawPage = parseInt((req.query.page as string) || '1', 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

    const rawLimit = parseInt((req.query.limit as string) || '10', 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, rawLimit)) : 10;

    const sortParamRaw = (req.query.sort as string) || '-createdAt';
    // allow list of fields, ignore empty entries
    const sortParam = sortParamRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5)
      .join(',');

    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 200) : '';

    const allowedRoles = new Set(['admin', 'user']);
    const role = typeof req.query.role === 'string' && allowedRoles.has(req.query.role) ? req.query.role : undefined;

    const allowedStatus = new Set(['activo', 'inactivo']);
    const status = typeof req.query.status === 'string' && allowedStatus.has(req.query.status) ? req.query.status : undefined;

    const filter: FilterQuery<IMember> = {};
    if (q) {
      const safe = escapeRegex(q);
      // eslint-disable-next-line security/detect-non-literal-regexp
      const re = new RegExp(safe, 'i');
      filter.$or = [{ nombre: re }, { email: re }];
    }
    if (role) filter.rol = role;
    if (status) filter.estado = status;

    const total = await Member.countDocuments(filter);

    // Build mongoose sort object from param like 'name,-createdAt'
    const sort: Record<string, 1 | -1> = {};
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
    const mapped = (items as IMember[]).map((it) => ({
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
