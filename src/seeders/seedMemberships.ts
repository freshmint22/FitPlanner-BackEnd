import dotenv from 'dotenv';
dotenv.config();
import { connectDB, disconnectDB } from '../db';
import Member from '../models/member.model';
import Membership from '../models/membership.model';

async function run() {
  await connectDB();
  console.log('Connected to DB for membership seeding');

  const members = await Member.find().lean();
  if (!members.length) {
    console.log('No members found — run main seed first (npm run seed)');
    await disconnectDB();
    process.exit(0);
  }

  const now = new Date();

  // Create memberships spread across the last 6 months for charting
  const monthsBack = 6;
  const prices = [150000, 120000, 100000, 180000];

  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    // pick a month offset to distribute starts
    const offset = i % monthsBack;
    const startsAt = new Date(now.getFullYear(), now.getMonth() - offset, 5 + (i % 20));
    const planName = ['Basic','Standard','Premium'][i % 3];
    const price = prices[i % prices.length];

    const exists = await Membership.findOne({ memberId: m._id, startsAt });
    if (exists) continue;

    await Membership.create({
      memberId: m._id,
      planName,
      startsAt,
      endsAt: null,
      active: true,
      // @ts-expect-error allow price field even if schema doesn't define it explicitly in Member
      price
    } as any);
  }

  console.log('Seeded memberships for', members.length, 'members');
  await disconnectDB();
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
