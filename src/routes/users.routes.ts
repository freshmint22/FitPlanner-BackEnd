import { Router, Request, Response } from "express";
import Member, { IMember } from "../models/member.model";
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

export default router;
