import { Request, Response } from "express";
import PlanService from "../services/plan.service";
import Member from "../models/member.model";

/* ============================
      LISTAR PLANES (ADMIN)
============================ */
export const getPlanes = async (req: Request, res: Response) => {
  try {
    const { estado } = req.query;
    const planes = await PlanService.getAll(estado as string);
    return res.json({ ok: true, data: planes });
  } catch (error: any) {
    return res.status(500).json({ ok: false, msg: error.message });
  }
};

/* ============================
   LISTAR PLANES ACTIVOS (USER)
============================ */
export const getPlanesActivos = async (req: Request, res: Response) => {
  try {
    const planes = await PlanService.getActive();
    return res.json({ ok: true, data: planes });
  } catch (error: any) {
    return res.status(500).json({ ok: false, msg: error.message });
  }
};

/* ============================
        CREAR PLAN
============================ */
export const createPlan = async (req: Request, res: Response) => {
  try {
    const { nombre, precio, descripcion, beneficios, popular } = req.body;

    if (!nombre || !precio || !descripcion || !beneficios?.length) {
      return res.status(400).json({
        ok: false,
        msg: "Todos los campos son obligatorios",
      });
    }

    const data = {
      nombre,
      precio,
      descripcion,
      beneficios,
      popular,
      creadoPor: req.user?.id,
      actualizadoPor: req.user?.id,
    };

    const plan = await PlanService.create(data);
    return res.json({ ok: true, data: plan });
  } catch (error: any) {
    return res.status(500).json({ ok: false, msg: error.message });
  }
};

/* ============================
        EDITAR PLAN
============================ */
export const updatePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const data = {
      ...req.body,
      actualizadoPor: req.user?.id,
    };

    const plan = await PlanService.update(id, data);

    if (!plan) {
      return res.status(404).json({ ok: false, msg: "Plan no encontrado" });
    }

    return res.json({ ok: true, data: plan });
  } catch (error: any) {
    return res.status(500).json({ ok: false, msg: error.message });
  }
};

/* ============================
      DESHABILITAR PLAN
============================ */
export const deactivatePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const plan = await PlanService.deactivate(id);

    if (!plan) {
      return res.status(404).json({ ok: false, msg: "Plan no encontrado" });
    }

    return res.json({ ok: true, msg: "Plan deshabilitado" });
  } catch (error: any) {
    return res.status(500).json({ ok: false, msg: error.message });
  }
};

/* ============================
     CAMBIAR PLAN DE USUARIO
============================ */
export const changeUserPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { planId } = req.body;

    // Asegurar que el plan esté activo
    const plan = await PlanService.getActive().then((p) =>
      p.find((x) => x._id.toString() === planId)
    );

    if (!plan) {
      return res.status(400).json({
        ok: false,
        msg: "No puedes asignar un plan inactivo o inexistente",
      });
    }

    const user = await Member.findByIdAndUpdate(
      id,
      {
        planActual: planId,
        fechaCambioPlan: new Date(),
      },
      { new: true }
    );

    return res.json({ ok: true, data: user });
  } catch (error: any) {
    return res.status(500).json({ ok: false, msg: error.message });
  }
};
