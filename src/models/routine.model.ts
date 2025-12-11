import mongoose, { Document, Schema } from 'mongoose';

export interface IExercise {
  name: string;
  sets?: number;
  reps?: number;
}

export interface IRoutine extends Document {
  name: string;
  description?: string;
  trainerId?: mongoose.Types.ObjectId | string;
  exercises: IExercise[];
  createdAt?: Date;
}

const ExerciseSchema = new Schema<IExercise>({
  name: { type: String, required: true },
  sets: { type: Number },
  reps: { type: Number },
});

const RoutineSchema = new Schema<IRoutine>({
  name: { type: String, required: true },
  description: { type: String },
  trainerId: { type: Schema.Types.ObjectId, ref: 'Member' },
  exercises: { type: [ExerciseSchema], default: [] },
  createdAt: { type: Date, default: () => new Date() },
});

export default mongoose.models.Routine || mongoose.model<IRoutine>('Routine', RoutineSchema);
