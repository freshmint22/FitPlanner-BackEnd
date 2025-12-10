import { connectDB, disconnectDB } from '../db';
import Member from '../models/member.model';
import Membership from '../models/membership.model';
import Payment from '../models/payment.model';
import Attendance from '../models/attendance.model';

async function seedProfiles(count = 50) {
  await connectDB();
  console.log('Connected for profiles seeding');

  // Ensure base members exist
  const base = [
    { nombre: 'Ana Perez', email: 'ana.perez@example.com', rol: 'admin' },
    { nombre: 'Juan Lopez', email: 'juan.lopez@example.com', rol: 'user' },
    { nombre: 'Maria Garcia', email: 'maria.garcia@example.com', rol: 'user' },
  ];

  for (const m of base) {
    await Member.updateOne({ email: m.email }, { $set: { ...m, estado: 'activo', password: 'pass' } }, { upsert: true });
  }

  // create additional synthetic members
  const createdMembers = [];
  for (let i = 0; i < count; i++) {
    const email = `seed.user.${i}@example.com`;
    const nombre = `Seed User ${i}`;
    const rol = i % 10 === 0 ? 'admin' : 'user';
    const up = await Member.findOneAndUpdate(
      { email },
      { $set: { nombre, email, rol, estado: 'activo', password: 'pass' } },
      { upsert: true, new: true }
    ).lean();
    if (up) createdMembers.push(up as any);
  }

  // For each created member, add a membership, payment and some attendances
  for (const mem of createdMembers) {
    const memberId = mem._id;
    await Membership.create({ memberId, planName: 'Basic', startsAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), active: true });
    await Payment.create({ memberId, amount: 29.99, currency: 'EUR', status: 'paid' });
    for (let j = 0; j < 3; j++) {
      await Attendance.create({ memberId, date: new Date(Date.now() - j * 1000 * 60 * 60 * 24) });
    }
  }

  console.log(`Seeded ${createdMembers.length} rich profiles`);

  await disconnectDB();
}

if (require.main === module) {
  const n = parseInt(process.env.SEED_PROFILES_COUNT || '50', 10);
  seedProfiles(n).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
