import { Request, Response, NextFunction } from "express";
import * as memberService from "../services/members.service";
import Member from "../models/member.model";
import bcrypt from "bcryptjs";
import { UserPayload } from "../middleware/auth";

/**
 * Obtener lista de miembros
 */
export const getMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const q = (req.query.q as string) || undefined;

    const result = await memberService.listMembers(page, limit, q);

    res.json({ data: result.data, total: result.total });
  } catch (err) {
    next(err);
  }
};

/**
 * Crear miembro
 */
export const createMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const created = await memberService.createMember(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

/**
 * Actualizar perfil
 */
export const updateMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberId = req.params.id;

    // Debug log to inspect incoming update requests
    // eslint-disable-next-line no-console
    console.log('PUT /members/:id called with id=', memberId, ' req.user=', req.user);

    if (!req.user || String(req.user.id) !== String(memberId)) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const updatedMember = await memberService.updateMember(memberId, req.body);

    return res.json({
      message: "Perfil actualizado correctamente",
      data: updatedMember,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * NUEVO: Actualizar membresía + registrar pago
 */
export const updateMemberMembership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.params;
    const { name, price, duration } = req.body;

    // 🔥 VALIDACIÓN IMPORTANTE
    if (!req.user || req.user.id !== memberId) {
      return res.status(403).json({ message: "No autorizado para actualizar esta membresía" });
    }

    if (!name || !price || !duration) {
      return res.status(400).json({ message: "Faltan datos de la membresía" });
    }

    const updatedMember = await memberService.updateMembership(memberId, {
      name,
      price,
      duration,
    });

    res.json({
      status: "success",
      message: "Membresía actualizada y pago registrado correctamente",
      data: updatedMember,
    });

  } catch (err) {
    next(err);
  }
};


/**
 * Eliminar miembro
 */
export const deleteMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await memberService.deleteMember(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
/**
 * Cambiar contraseña (HU-21)
 */
export const changePassword = async (
  req: Request & { user?: UserPayload },
  res: Response
) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

    const user = await Member.findById(userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    // Validar contraseña actual
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ message: "La contraseña actual es incorrecta" });
    }

    // Validaciones de seguridad
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "La nueva contraseña debe tener mínimo 8 caracteres" });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res
        .status(400)
        .json({ message: "La nueva contraseña debe incluir una letra mayúscula" });
    }

    // Actualizar contraseña
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return res.json({ message: "Contraseña actualizada exitosamente" });

  } catch (err: unknown) {
    console.error("Error al cambiar contraseña:", err);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Eliminar cuenta (soft delete)
 */
export const deleteAccount = async (
  req: Request & { user?: UserPayload },
  res: Response
) => {
  try {
    const userId = req.user?.id;

    const user = await Member.findById(userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    // Soft delete: marcar como inactivo
    user.estado = "inactivo";
    await user.save();

    return res.json({ message: "Cuenta eliminada exitosamente" });

  } catch (err: unknown) {
    console.error("Error al eliminar cuenta:", err);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

