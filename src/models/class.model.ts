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
