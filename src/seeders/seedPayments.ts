import dotenv from 'dotenv';
dotenv.config();
import { connectDB, disconnectDB } from '../db';
import Member from '../models/member.model';
import Payment from '../models/payment.model';

async function run() {
  await connectDB();
  console.log('Connected to DB for payment seeding');

  const members = await Member.find().lean();
  if (!members.length) {
    console.log('No members found — run main seed first (npm run seed)');
    await disconnectDB();
    process.exit(0);
  }

  const now = new Date();
  const monthsBack = 6;
  const sampleAmounts = [150000, 120000, 100000, 180000, 90000];

  // For each member create 1-2 payments spread in recent months
  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    const paymentsCount = 1 + (i % 2);
    for (let p = 0; p < paymentsCount; p++) {
      const offset = (i + p) % monthsBack;
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 10 + ((i + p) % 15));
      const amount = sampleAmounts[(i + p) % sampleAmounts.length];

      await Payment.create({
        memberId: String(m._id),
        amount,
        date,
        method: 'Seeder'
      });
    }
  }

  console.log('Seeded payments for', members.length, 'members');
  await disconnectDB();
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
