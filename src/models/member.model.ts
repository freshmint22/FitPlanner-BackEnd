import { Schema, model, Document } from 'mongoose';

export interface IMember extends Document {
  nombre: string;
  email: string;
  rol: 'admin' | 'user' | string;
  estado: 'activo' | 'inactivo' | string;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    rol: { type: String, default: 'user' },
    estado: { type: String, default: 'activo' }
  },
  { timestamps: true }
);

const Member = model<IMember>('Member', MemberSchema);

export default Member;
