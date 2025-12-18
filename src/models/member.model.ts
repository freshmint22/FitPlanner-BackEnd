import mongoose, { Schema, model, Document, Model } from "mongoose";

export interface IMember extends Document {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
  birthDate?: Date;
  gender?: "Masculino" | "Femenino" | "Otro";
  profileImage?: string;
  rol: "admin" | "user" | string;
  estado: "activo" | "inactivo" | string;

  membership?: {
    name: string;
    price: number;
    duration: number;
    startDate: Date;
    endDate: Date;
  };

  planActual?: string | null;
  fechaCambioPlan?: Date;

  // 🔐 RECUPERAR CONTRASEÑA
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  // Usuario que creó este miembro (opcional)
  createdBy?: Schema.Types.ObjectId | string;

  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true
    },

    password: { type: String, required: true },
    phone: { type: String, trim: true },
    birthDate: { type: Date },

    gender: {
      type: String,
      enum: ["Masculino", "Femenino", "Otro"],
      default: "Otro"
    },

    profileImage: { type: String },

    rol: { type: String, default: "user" },
    estado: { type: String, default: "activo" },

    membership: {
      type: {
        name: String,
        price: Number,
        duration: Number,
        startDate: Date,
        endDate: Date,
        paymentMethod: String
      }
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Member', index: true },

    planActual: { type: String, default: null },
    fechaCambioPlan: { type: Date },

    // 🔐 RESET
    resetPasswordToken: String,
    resetPasswordExpires: Date
  },
  { timestamps: true }
);

type MemberModelType = Model<IMember>;
const Member: MemberModelType = ((mongoose.models && (mongoose.models as any).Member) as MemberModelType) || model<IMember>("Member", MemberSchema) as MemberModelType;
export default Member;
