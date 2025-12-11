import { Router, Request, Response } from "express";
import Member, { IMember } from "../models/member.model";
import Membership from "../models/membership.model";
import Payment from "../models/payment.model";
import Attendance from "../models/attendance.model";
import type { FilterQuery } from "mongoose";
import { requireAuth } from "../middleware/auth";
import { changePassword } from "../controllers/members.controller";

const router = Router();

// Endpoint usado en pruebas
router.get("/profile", (_req, res) => {
  res.status(200).json({ email: "test@example.com" });
});

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

      return res.json({ items: mapped, total, page, limit });
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
        memberships: memberships.map((m) => ({ planName: m.planName, startsAt: m.startsAt, endsAt: m.endsAt, active: m.active })),
        payments: payments.map((p: any) => ({
          amount: (p && (p.amount ?? p.total ?? 0)) as number,
          currency: (p && (p.currency ?? p.moneda ?? null)) as string | null,
          status: (p && (p.status ?? p.estado ?? null)) as string | null,
          createdAt: (p && (p.createdAt ?? p.created_at ?? null)) as string | Date | null,
        })),
        activity: activity.map((a) => ({ date: a.date, classId: a.classId })),
      } as const;

      return res.json({ item: dto });
    } catch (err) {
      console.error('GET /users/:id error', err);
      return res.status(500).json({ error: { code: 'server_error', message: 'Internal error' } });
    }
  }
);

export default router;

