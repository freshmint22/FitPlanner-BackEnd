import { Schema, model, Document } from "mongoose";

export interface IGeneralConfig extends Document {
  nombreSistema: string;
  colorPrimario: string;
  colorSecundario: string;
  limiteUsuarios: number;
  modoMantenimiento: boolean;
  updatedBy?: string;
  updatedAt?: Date;
}

const GeneralConfigSchema = new Schema<IGeneralConfig>(
  {
    nombreSistema: {
      type: String,
      required: true,
      default: "FitPlanner System"
    },

    colorPrimario: {
      type: String,
      required: true,
      default: "#1E90FF" // azul
    },

    colorSecundario: {
      type: String,
      required: true,
      default: "#141414"
    },

    limiteUsuarios: {
      type: Number,
      required: true,
      default: 100
    },

    modoMantenimiento: {
      type: Boolean,
      required: true,
      default: false
    },

    updatedBy: { type: String },
  },
  { timestamps: true }
);

const GeneralConfig = model<IGeneralConfig>(
  "GeneralConfig",
  GeneralConfigSchema
);

export default GeneralConfig;
