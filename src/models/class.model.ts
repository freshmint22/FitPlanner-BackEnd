import mongoose, { Document, Schema } from 'mongoose';

export interface IClass extends Document {
  title?: string;
  name?: string;
  description?: string;
  capacity?: number;
  schedule?: Date;
  date?: Date;
  instructorName?: string;
  trainerId?: mongoose.Types.ObjectId | string;
  createdAt?: Date;
}

const ClassSchema = new Schema<IClass>({
  // legacy field: `name` used in many tests/routes
  name: { type: String },
  // canonical field for display/title (kept for newer code)
  title: { type: String, required: function(this: any) { return !this.name; } },
  description: { type: String },
  // capacity used by reports and reservations
  capacity: { type: Number, default: 20 },
  // legacy date field used by tests/routes
  date: { type: Date },
  // canonical schedule field
  schedule: { type: Date },
  // legacy instructor name used by reports
  instructorName: { type: String },
  trainerId: { type: Schema.Types.ObjectId, ref: 'Member' },
  createdAt: { type: Date, default: () => new Date() },
});

export default mongoose.models.Class || mongoose.model<IClass>('Class', ClassSchema);
