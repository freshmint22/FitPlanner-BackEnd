import { Request, Response } from "express";
import { createSimulatedPayment } from "../services/payments.service";

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
