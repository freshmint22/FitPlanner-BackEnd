import dotenv from 'dotenv';
dotenv.config();
import { connectDB, disconnectDB } from '../db';
import Membership from '../models/membership.model';
import Payment from '../models/payment.model';

async function run() {
  await connectDB();
  console.log('Connected to DB');

  // Fill missing price on Membership documents using the latest Payment of the member
  // Fallback to DEFAULT_PRICE when no payment is found
  const DEFAULT_PRICE = 150000;

  const filter: any = { $or: [{ price: { $exists: false } }, { price: null }] };

  const memberships = await Membership.find(filter).lean();
  console.log('Memberships missing price:', memberships.length);

  let updated = 0;

  for (const m of memberships) {
    try {
      const lastPayment = await Payment.findOne({ memberId: String(m.memberId), date: { $lte: m.startsAt } })
        .sort({ date: -1 })
        .lean();

      const priceToSet = lastPayment ? lastPayment.amount : DEFAULT_PRICE;

      const r = await Membership.updateOne({ _id: m._id }, { $set: { price: priceToSet } });
      if ((r as any).modifiedCount && (r as any).modifiedCount > 0) updated++;
    } catch (e) {
      console.error('Error updating membership', m._id, e);
    }
  }

  console.log('Documents updated:', updated);

  const sample = await Membership.findOne({ _id: memberships.length ? memberships[0]._id : { $exists: true } }).lean();
  console.log('Sample (after):', sample);

  await disconnectDB();
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
