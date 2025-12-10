import { Schema, model, Document } from 'mongoose';

export interface IMembership extends Document {
  memberId: Schema.Types.ObjectId | string;
  planName: string;
  startsAt: Date;
  endsAt?: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    planName: { type: String, required: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

MembershipSchema.index({ memberId: 1, active: 1 });

const Membership = model<IMembership>('Membership', MembershipSchema);

export default Membership;
