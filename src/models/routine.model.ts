import { Schema, model, Document, Types } from "mongoose";

export interface IRoutine extends Document {
  usuario: Types.ObjectId;
  nombre: string;
  diasPorSemana: number;
  objetivo: string;
  enfoque: string[];
  nivel: string;
  dias: any[];
  estado: "activa" | "borrador";
  createdAt: Date;
  updatedAt: Date;
}

const RoutineSchema = new Schema(
  {
    usuario: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true
    },
    nombre: {
      type: String,
      required: true
    },
    diasPorSemana: {
      type: Number,
      required: true
    },
    objetivo: {
      type: String,
      required: true
    },
    enfoque: {
      type: [String],
      default: []
    },
    nivel: {
      type: String,
      required: true
    },
    dias: {
      type: Schema.Types.Mixed,
      default: []
    },
    estado: {
      type: String,
      enum: ["activa", "borrador"],
      default: "activa"
    }
  },
  {
    timestamps: true
  }
);

export default model<IRoutine>("Routine", RoutineSchema);
