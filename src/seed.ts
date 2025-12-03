import { connectDB, disconnectDB } from './db';
import Member from './models/member.model';

const sampleMembers = [
  { nombre: 'Ana Perez', email: 'ana.perez@example.com', rol: 'admin' },
  { nombre: 'Juan Lopez', email: 'juan.lopez@example.com', rol: 'user' },
  { nombre: 'María García', email: 'maria.garcia@example.com', rol: 'user' },
  { nombre: 'Luis Martinez', email: 'luis.martinez@example.com', rol: 'user' },
  { nombre: 'Carmen Díaz', email: 'carmen.diaz@example.com', rol: 'user' }
];

async function seed() {
  try {
    await connectDB();
    console.log('Connected to MongoDB for seeding');

    for (const m of sampleMembers) {
      await Member.updateOne({ email: m.email }, { $set: m }, { upsert: true });
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
