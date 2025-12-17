import dotenv from 'dotenv';
dotenv.config();
import { connectDB, disconnectDB } from '../db';
import Member from '../models/member.model';
import Membership from '../models/membership.model';
import Payment from '../models/payment.model';
import Attendance from '../models/attendance.model';

async function run() {
  await connectDB();
  console.log('Connected to DB');
  const totalMembers = await Member.countDocuments();
  const activeMemberships = await Membership.countDocuments({ active: true });
  const paymentsCount = await Payment.countDocuments();
  const attendances = await Attendance.countDocuments();

  console.log('Totals:');
  console.log('Members:', totalMembers);
  console.log('Active Memberships:', activeMemberships);
  console.log('Payments:', paymentsCount);
  console.log('Attendances:', attendances);

  const memberSample = await Member.findOne().lean();
  const membershipSample = await Membership.findOne().lean();
  const paymentSample = await Payment.findOne().lean();

  console.log('\nSample documents:');
  console.log('Member sample:', memberSample);
  console.log('Membership sample:', membershipSample);
  console.log('Payment sample:', paymentSample);

  await disconnectDB();
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
