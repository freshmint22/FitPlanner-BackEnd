import { Schema, model, Document } from 'mongoose';

export interface IMember extends Document {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;   
  phone?: string;
  birthDate?: Date;
  gender?: 'Masculino' | 'Femenino' | 'Otro';
  profileImage?: string;
  rol: 'admin' | 'user' | string;
  estado: 'activo' | 'inactivo' | string;
  createdAt: Date;
  updatedAt: Date;
}


const MemberSchema = new Schema<IMember>(
  {
    firstName: { type: String, trim: true, required: false },
    lastName: { type: String, trim: true, required: false },

    email: { type: String, required: true, unique: true, index: true, lowercase: true },

    password: { type: String, required: true }, 
    phone: { type: String, trim: true },

    birthDate: { type: Date },

    gender: {
      type: String,
      enum: ["Masculino", "Femenino", "Otro"],
      default: "Otro"
    },

    profileImage: { type: String },

    rol: { type: String, default: 'user' },

    estado: { type: String, default: 'activo' }
  },
  { timestamps: true }
);

const Member = model<IMember>('Member', MemberSchema);

export default Member;
