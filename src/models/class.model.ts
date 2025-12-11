import mongoose, { Document, Schema } from 'mongoose';

export interface IClass extends Document {
  title: string;
  description?: string;
  capacity?: number;
  schedule?: Date;
  trainerId?: mongoose.Types.ObjectId | string;
  createdAt?: Date;
}

const ClassSchema = new Schema<IClass>({
  title: { type: String, required: true },
  description: { type: String },
  capacity: { type: Number, default: 20 },
  schedule: { type: Date },
  trainerId: { type: Schema.Types.ObjectId, ref: 'Member' },
  createdAt: { type: Date, default: () => new Date() },
});

export default mongoose.models.Class || mongoose.model<IClass>('Class', ClassSchema);
import { Schema, model, Document } from "mongoose";

export interface IClass extends Document {
  name: string;
  instructorName: string;
  date: Date;
  capacity: number;
  room?: string;
}

const ClassSchema = new Schema<IClass>(
  {
    name: { type: String, required: true },
    instructorName: { type: String, required: true },
    date: { type: Date, required: true },
    capacity: { type: Number, required: true },
    room: { type: String }
  },
  {
    timestamps: true
  }
);

export default model<IClass>("Class", ClassSchema);
