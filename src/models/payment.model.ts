import { Schema, model, Document } from "mongoose";

export interface PaymentDocument extends Document {
  memberId: string;
  amount: number;
  date: Date;
  method: string;
}

const PaymentSchema = new Schema<PaymentDocument>(
  {
    memberId: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    method: { type: String, default: "Simulado" }
  },
  { timestamps: true }
);

export default model<PaymentDocument>("Payment", PaymentSchema);
