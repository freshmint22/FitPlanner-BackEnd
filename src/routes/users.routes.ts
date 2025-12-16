import { Router, Request, Response } from "express";
import Member, { IMember } from "../models/member.model";
import Membership from "../models/membership.model";
import Payment from "../models/payment.model";
import Attendance from "../models/attendance.model";
import type { FilterQuery } from "mongoose";
import { requireAuth } from "../middleware/auth";
import { changePassword } from "../controllers/members.controller";
import { getProfile } from "../controllers/auth.controller";

const router = Router();

// POST /users/membership/purchase - simulate a purchase for authenticated user
router.post('/membership/purchase', requireAuth, async (req: Request & { user?: { id?: string } }, res: Response) => {
  try {
    const memberId = req.user?.id as string;
    if (!memberId) return res.status(401).json({ error: 'unauthenticated' });

    const { planName, price, durationDays, method } = req.body || {};
    const amount = Number(price) || 0;
    const days = Number(durationDays) || 30;

    // mark previous memberships inactive
    await Membership.updateMany({ memberId, active: true }, { active: false }).catch(() => {});

    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + days * 24 * 60 * 60 * 1000);

    const membership = await Membership.create({ memberId, planName: planName || 'Desconocido', startsAt, endsAt, active: true });

    await Payment.create({ memberId, amount, method: method || 'Simulado' });

    await Member.findByIdAndUpdate(memberId, { membership: { name: planName, price: amount, duration: days, startDate: startsAt, endDate: endsAt }, planActual: planName, fechaCambioPlan: new Date() });

    return res.json({ membership, nextPayment: endsAt, paymentMethod: method || 'Simulado' });
  } catch (err) {
    console.error('membership purchase error', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// POST /users/membership/cancel - cancel current membership
router.post('/membership/cancel', requireAuth, async (req: Request & { user?: { id?: string } }, res: Response) => {
  try {
    const memberId = req.user?.id as string;
    if (!memberId) return res.status(401).json({ error: 'unauthenticated' });

    await Membership.updateMany({ memberId, active: true }, { active: false });
    await Member.findByIdAndUpdate(memberId, { membership: null, planActual: null });

    return res.json({ ok: true, status: 'cancelled' });
  } catch (err) {
    console.error('membership cancel error', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// Endpoint de perfil con autenticación
router.get("/profile", requireAuth, getProfile);

// Función para sanear búsquedas regex
function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /users - Solo admin puede listar usuarios
router.get(
  "/",
  requireAuth,
  async (req: Request & { user?: { rol?: string } }, res: Response) => {
    try {
      // Validar rol ADMIN
      if (req.user?.rol !== "admin") {
        return res
          .status(403)
          .json({ error: { code: "forbidden", message: "Requires admin role" } });
      }

      // Parámetros
      const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
      const limit = Math.max(
        1,
        Math.min(100, parseInt((req.query.limit as string) || "10", 10))
      );

      const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

      // Filtro basado en NUEVO MODELO
      const filter: FilterQuery<IMember> = {};

      if (q) {
        const safe = escapeRegex(q);
        // `safe` is escaped so using RegExp here is safe; disable the rule for this line.
        /* eslint-disable-next-line security/detect-non-literal-regexp */
        const re = new RegExp(safe, "i");
        filter.$or = [{ firstName: re }, { lastName: re }, { email: re }];
      }

      const total = await Member.countDocuments(filter);

      const items = await Member.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      const mapped = items.map((it) => ({
        id: it._id.toString(),
        firstName: it.firstName,
        lastName: it.lastName,
        email: it.email,
        rol: it.rol,
        estado: it.estado,
        createdAt: it.createdAt,
      }));

      // Return both `data` (used by existing tests) and `items` (newer shape)
      return res.json({ data: mapped, items: mapped, total, page, limit });
    } catch (err) {
      console.error("GET /users error", err);
      return res
        .status(500)
        .json({ error: { code: "server_error", message: "Internal error" } });
    }
  }
);

// ==============================
// NUEVA RUTA: CAMBIAR CONTRASEÑA
// ==============================
router.patch("/password", requireAuth, changePassword);

// ==============================
// NUEVA RUTA: ELIMINAR CUENTA
// ==============================
import { deleteAccount } from "../controllers/members.controller";
router.delete("/account", requireAuth, deleteAccount);

// GET /users/:id - Obtener perfil de usuario
router.get(
  "/:id",
  requireAuth,
  async (req: Request & { user?: { id?: string; rol?: string } }, res: Response) => {
    try {
      const { id } = req.params;

      // validar formato ObjectId
      const mongoose = await import('mongoose');
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: { code: 'invalid_id', message: 'Invalid id format' } });
      }

      // autorización: admin puede ver cualquier perfil; usuario puede ver su propio perfil
      const requesterId = req.user?.id;
      const requesterRole = req.user?.rol;

      const member = await Member.findById(id).lean();
      if (!member) {
        return res.status(404).json({ error: { code: 'not_found', message: 'User not found' } });
      }

      if (requesterId !== id && requesterRole !== 'admin') {
        return res.status(403).json({ error: { code: 'forbidden', message: 'Requires admin role or owner' } });
      }

      // cargar relaciones recientes (limitadas) para compatibilidad con frontend
      const [memberships, payments, activity] = await Promise.all([
        Membership.find({ memberId: member._id }).sort({ startsAt: -1 }).limit(10).lean(),
        Payment.find({ memberId: member._id }).sort({ createdAt: -1 }).limit(10).lean(),
        Attendance.find({ memberId: member._id }).sort({ date: -1 }).limit(10).lean(),
      ]);

      // construir DTO compatible con frontend
      const membershipsAny: any[] = memberships as any;
      const paymentsAny: any[] = payments as any;
      const activityAny: any[] = activity as any;

      const dto = {
        id: member._id?.toString(),
        firstName:
          member.firstName ??
          (typeof (member as unknown as Record<string, unknown>).nombre === 'string'
            ? ((member as unknown as Record<string, unknown>).nombre as string)
            : ''),
        lastName: member.lastName || '',
        email: member.email,
        rol: member.rol,
        estado: member.estado,
        createdAt: member.createdAt,
        memberships: membershipsAny.map((m) => ({ planName: m.planName, startsAt: m.startsAt, endsAt: m.endsAt, active: m.active })),
        payments: paymentsAny.map((p) => ({ amount: p.amount, currency: p.currency, status: p.status, createdAt: p.createdAt })),
        activity: activityAny.map((a) => ({ date: a.date, classId: a.classId })),
      } as const;

      return res.json({ item: dto });
    } catch (err) {
      console.error('GET /users/:id error', err);
      return res.status(500).json({ error: { code: 'server_error', message: 'Internal error' } });
    }
  }
);

export default router;

