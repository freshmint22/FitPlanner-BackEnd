import { Schema, model, Document } from "mongoose";

export interface IPlan extends Document {
  nombre: string;
  precio: number;
  descripcion: string;
  beneficios: string[];
  estado: "activo" | "inactivo";
  popular: boolean;
  creadoPor: string;
  actualizadoPor: string;
}

const PlanSchema = new Schema<IPlan>(
  {
    nombre: { type: String, required: true, trim: true },
    precio: { type: Number, required: true },
    descripcion: { type: String, required: true, trim: true },
    beneficios: { type: [String], required: true },
    estado: { type: String, enum: ["activo", "inactivo"], default: "activo" },
    popular: { type: Boolean, default: false },
    creadoPor: { type: String, required: true },
    actualizadoPor: { type: String, required: true }
  },
  { timestamps: true }
);

export default model<IPlan>("Plan", PlanSchema);
