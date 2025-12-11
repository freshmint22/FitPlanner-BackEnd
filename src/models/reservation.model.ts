import mongoose, { Document, Schema } from 'mongoose';

export interface IReservation extends Document {
  memberId: mongoose.Types.ObjectId | string;
  classId: mongoose.Types.ObjectId | string;
  status: 'booked' | 'cancelled' | 'attended';
  reservedAt?: Date;
}

const ReservationSchema = new Schema<IReservation>({
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  status: { type: String, enum: ['booked', 'cancelled', 'attended'], default: 'booked' },
  reservedAt: { type: Date, default: () => new Date() },
});

export default mongoose.models.Reservation || mongoose.model<IReservation>('Reservation', ReservationSchema);
