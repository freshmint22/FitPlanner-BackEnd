import { Schema, model } from "mongoose";

const AttendanceSchema = new Schema(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: false },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

AttendanceSchema.index({ memberId: 1, date: -1 });

const Attendance = model("Attendance", AttendanceSchema);

export default Attendance;
