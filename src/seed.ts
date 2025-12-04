import { connectDB, disconnectDB } from './db';
import Member from './models/member.model';

async function seed() {
  try {
    await connectDB();
    console.log('Connected to MongoDB for seeding');

    const seedCount = parseInt(process.env.SEED_COUNT || '0', 10);

    const base = [
      { nombre: 'Ana Perez', email: 'ana.perez@example.com', rol: 'admin' },
      { nombre: 'Juan Lopez', email: 'juan.lopez@example.com', rol: 'user' },
      { nombre: 'María García', email: 'maria.garcia@example.com', rol: 'user' },
      { nombre: 'Luis Martinez', email: 'luis.martinez@example.com', rol: 'user' },
      { nombre: 'Carmen Díaz', email: 'carmen.diaz@example.com', rol: 'user' }
    ];

    // Insert base users (upsert)
    for (const m of base) {
      await Member.updateOne({ email: m.email }, { $set: m }, { upsert: true });
    }

    // If SEED_COUNT requested, create additional synthetic users
    if (seedCount > base.length) {
      const toCreate = seedCount - base.length;
      const bulk: any[] = [];
      for (let i = 0; i < toCreate; i++) {
        const idx = i + 1;
        const email = `seed.user.${idx}@example.com`;
        bulk.push({
          updateOne: {
            filter: { email },
            update: {
              $set: {
                nombre: `Seed User ${idx}`,
                email,
                rol: idx % 10 === 0 ? 'admin' : 'user',
                estado: 'activo'
              }
            },
            upsert: true
          }
        });
      }
      if (bulk.length) {
        await Member.bulkWrite(bulk);
      }
      console.log(`Seeded ${seedCount} users (including ${base.length} base users)`);
    } else {
      console.log('Seeded base users');
    }

    console.log('Seeding completed');
  } catch (err) {
    console.error('Seeding failed', err);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

seed();
