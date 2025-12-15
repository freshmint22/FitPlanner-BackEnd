import mongoose, { Document, Schema } from 'mongoose';

export interface IExercise {
  name: string;
  sets?: number;
  reps?: number;
}

export interface IRoutine extends Document {
  name?: string;
  nombre?: string;
  usuario?: mongoose.Types.ObjectId | string;
  trainerId?: mongoose.Types.ObjectId | string;
  diasPorSemana?: number;
  objetivo?: string;
  enfoque?: string[];
  nivel?: string;
  dias?: Array<{ dia: number; ejercicios: any[] }>;
  estado?: string;
  exercises?: IExercise[];
  createdAt?: Date;
}

const ExerciseSchema = new Schema<IExercise>({
  name: { type: String, required: true },
  sets: { type: Number },
  reps: { type: Number },
});

const RoutineSchema = new Schema<IRoutine>(
  {
    // keep both english and spanish fields for compatibility
    name: { type: String },
    nombre: { type: String },
    usuario: { type: Schema.Types.ObjectId, ref: 'Member' },
    diasPorSemana: { type: Number },
    objetivo: { type: String },
    enfoque: { type: [String], default: [] },
    nivel: { type: String },
    dias: { type: [{ dia: Number, ejercicios: Array }], default: [] },
    estado: { type: String, default: 'activa' },
    trainerId: { type: Schema.Types.ObjectId, ref: 'Member' },
    exercises: { type: [ExerciseSchema], default: [] },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

// Ensure `name` mirrors `nombre` for code expecting English field
RoutineSchema.virtual('nameAlias')
  .get(function (this: any) {
    return this.name || this.nombre;
  })
  .set(function (this: any, v: any) {
    this.name = v;
    this.nombre = v;
  });

export default mongoose.models.Routine || mongoose.model<IRoutine>('Routine', RoutineSchema);
