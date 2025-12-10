import { Schema, model, Document } from "mongoose";

export interface INotificationConfig extends Document {
  tipo: "email" | "push" | "interna";
  frecuencia: "diaria" | "semanal" | "mensual";
  habilitado: boolean;
  ultimoEnvioPrueba?: Date;
  adminId: string;
}

const NotificationConfigSchema = new Schema<INotificationConfig>(
  {
    tipo: {
      type: String,
      enum: ["email", "push", "interna"],
      required: true,
    },
    frecuencia: {
      type: String,
      enum: ["diaria", "semanal", "mensual"],
      required: true,
    },
    habilitado: { type: Boolean, default: true },
    ultimoEnvioPrueba: { type: Date },
    adminId: { type: String, required: true },
  },
  { timestamps: true }
);

export default model<INotificationConfig>(
  "NotificationConfig",
  NotificationConfigSchema
);
