import mongoose, { Document, Schema } from 'mongoose';

export interface IExerciseStatus {
  name: string;
  completed?: boolean;
  completedAt?: Date | null;
}

export interface IRoutineAssignment extends Document {
  routineId: mongoose.Types.ObjectId | string;
  memberId: mongoose.Types.ObjectId | string;
  days?: string[]; // e.g. ['Lunes','Miercoles']
  exercisesStatus: IExerciseStatus[];
  createdAt?: Date;
}

const ExerciseStatusSchema = new Schema<IExerciseStatus>({
  name: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
});

const RoutineAssignmentSchema = new Schema<IRoutineAssignment>({
  routineId: { type: Schema.Types.ObjectId, ref: 'Routine', required: true },
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  days: { type: [String], default: [] },
  exercisesStatus: { type: [ExerciseStatusSchema], default: [] },
  createdAt: { type: Date, default: () => new Date() },
});

export default mongoose.models.RoutineAssignment || mongoose.model<IRoutineAssignment>('RoutineAssignment', RoutineAssignmentSchema);
