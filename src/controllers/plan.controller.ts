import { Request, Response } from "express";
import PlanService from "../services/plan.service";
import Member from "../models/member.model";
import Plan from "../models/plan.model";
import mongoose from 'mongoose';
import Payment from "../models/payment.model";

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

/* ============================
     COMPRA / SUSCRIPCIÓN DE PLAN (USER)
============================ */
export const purchasePlan = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ ok: false, msg: 'Unauthorized' });

    console.log('purchasePlan called, req.user:', req.user);

    const { planId, durationDays, method } = req.body;
    if (!planId) return res.status(400).json({ ok: false, msg: 'planId is required' });

    let plan: any = null;
    // If planId looks like a valid ObjectId, try to load the plan from the DB.
    if (planId && mongoose.Types.ObjectId.isValid(String(planId))) {
      plan = await Plan.findById(planId);
      if (!plan || plan.estado !== 'activo') return res.status(400).json({ ok: false, msg: 'Plan no disponible' });
    } else {
      // No valid planId provided (frontend may send sample plan ids). Use planName/price from body as fallback.
      // Build a lightweight plan-like object so membership can be created for demo/sample plans.
      plan = {
        nombre: req.body.planName || 'Membresía',
        precio: req.body.price ? Number(String(req.body.price).replace(/[^0-9]/g, '')) : 0,
        estado: 'activo'
      };
    }

    // determine duration: prefer provided, otherwise infer from name
    let duration = Number(durationDays) || 30;
    const nameLower = String(plan.nombre || '').toLowerCase();
    if (nameLower.includes('semestral')) duration = durationDays ? Number(durationDays) : 180;
    if (nameLower.includes('anual')) duration = durationDays ? Number(durationDays) : 365;

    const start = new Date();
    const end = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);

    // Ensure the member exists before updating. If findById fails, try fallback by email.
    let targetId = userId;
    let existing = await Member.findById(targetId);
    console.log('Existing member before update (by id):', !!existing);
    if (!existing && req.user?.email) {
      existing = await Member.findOne({ email: String(req.user.email).toLowerCase() });
      if (existing) {
        targetId = existing._id.toString();
        console.log('Found existing member by email, using id:', targetId);
      }
    }

    if (!existing) {
      console.warn('Member not found for userId:', userId, 'req.user:', req.user);
      return res.status(404).json({ ok: false, msg: 'Member not found' });
    }

    const updated = await Member.findByIdAndUpdate(targetId, {
      membership: {
        name: plan.nombre,
        price: plan.precio,
        duration,
        startDate: start,
        endDate: end,
        paymentMethod: method || 'Desconocido'
      },
      planActual: plan._id || null,
      fechaCambioPlan: new Date(),
    }, { new: true });
    if (!updated) {
      console.error('Failed to update member document for id:', targetId);
      return res.status(500).json({ ok: false, msg: 'Failed to update member' });
    }

    // create a Payment record so purchases are persisted (only after member update)
    try {
      const amountNum = typeof plan.precio === 'number' ? plan.precio : Number(String(plan.precio).replace(/[^0-9]/g, '')) || 0;
      const payment = await Payment.create({ memberId: targetId, amount: amountNum, method: method || 'Desconocido' });
      console.log('Payment created:', { id: payment._id?.toString(), memberId: payment.memberId, amount: payment.amount, method: payment.method });
    } catch (e) {
      console.warn('Failed to create payment record', e);
    }

    console.log('Member updated after purchase:', { id: updated._id?.toString(), membership: updated.membership });

    return res.json({ ok: true, data: updated });
  } catch (error: any) {
    console.error('purchasePlan error:', error);
    return res.status(500).json({ ok: false, msg: error.message });
  }
};

/* ============================
     CANCELAR SUSCRIPCIÓN (USER)
============================ */
export const cancelPurchase = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ ok: false, msg: 'Unauthorized' });

    // Try to find the member by id; if not found, fallback to email (some tokens store email)
    let targetId = userId;
    let existing = await Member.findById(targetId);
    if (!existing && req.user?.email) {
      existing = await Member.findOne({ email: String(req.user.email).toLowerCase() });
      if (existing) {
        targetId = existing._id.toString();
        console.log('cancelPurchase: found member by email, using id:', targetId);
      }
    }

    if (!existing) {
      console.warn('cancelPurchase: member not found for', { userId, email: req.user?.email });
      return res.status(404).json({ ok: false, msg: 'Member not found' });
    }

    // Remove membership but keep payment history intact.
    const updated = await Member.findByIdAndUpdate(targetId, {
      membership: null,
      planActual: null,
      fechaCambioPlan: new Date()
    }, { new: true });

    console.log('cancelPurchase: member updated (membership removed) for id:', targetId);

    return res.json({ ok: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ ok: false, msg: error.message });
  }
};
