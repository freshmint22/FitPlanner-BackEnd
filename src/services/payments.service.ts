import Payment from "../models/payment.model";

interface PaymentParams {
  memberId: string;
  amount: number;
  method?: string;
}

export const createSimulatedPayment = async ({
  memberId,
  amount,
  method = "Simulado"
}: PaymentParams) => {
  try {
    const newPayment = await Payment.create({
      memberId,
      amount,
      method,
      date: new Date()
    });

    return newPayment;
  } catch (error) {
    console.error(error);
    throw new Error("Error registrando el pago simulado");
  }
};
