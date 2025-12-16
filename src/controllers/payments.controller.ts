import { Request, Response } from "express";
import { createSimulatedPayment } from "../services/payments.service";
import Payment from "../models/payment.model";
import Member from "../models/member.model";

export const simulatePayment = async (req: Request, res: Response) => {
  try {
    const { memberId, amount } = req.body;

    if (!memberId || !amount) {
      return res.status(400).json({
        status: "error",
        message: "memberId y amount son obligatorios"
      });
    }

    const payment = await createSimulatedPayment({
      memberId,
      amount
    });

    res.json({
      status: "success",
      message: "Pago simulado registrado correctamente",
      data: payment
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

export const getUserPayments = async (req: Request, res: Response) => {
  try {
    // Resolve the actual member id: prefer req.user.id but fallback to lookup by email
    let userId = req.user?.id as string | undefined;
    if (!userId && !req.user?.email) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    // If userId is present but no member exists with that id, try to find by email
    let memberExists = null;
    if (userId) memberExists = await Member.findById(userId).lean();
    if (!memberExists && req.user?.email) {
      const found = await Member.findOne({ email: String(req.user.email).toLowerCase() }).lean();
      if (found) userId = String(found._id);
    }

    if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    const payments = await Payment.find({ memberId: userId }).sort({ date: -1 }).limit(100).lean();
    return res.json({ status: 'success', data: payments });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
