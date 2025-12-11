import { Schema, model, Document } from "mongoose";

export interface IGymInfo extends Document {
  nombre: string;
  direccion: string;
  telefono: string;
  horarios: string;
  updatedBy: string;
}

const GymInfoSchema = new Schema<IGymInfo>(
  {
    nombre: { type: String, required: true, trim: true },
    direccion: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    horarios: { type: String, required: true, trim: true },
    updatedBy: { type: String, required: true }
  },
  { timestamps: true }
);

export default model<IGymInfo>("GymInfo", GymInfoSchema);
