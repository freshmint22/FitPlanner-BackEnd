import { Schema, model, Document } from 'mongoose';

export interface IPayment extends Document {
  memberId: Schema.Types.ObjectId | string;
  amount: number;
  currency: string;
  status: 'paid' | 'failed' | 'pending' | string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'EUR' },
    status: { type: String, default: 'paid' }
  },
  { timestamps: true }
);

PaymentSchema.index({ memberId: 1, createdAt: -1 });

const Payment = model<IPayment>('Payment', PaymentSchema);

export default Payment;
