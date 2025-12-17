import dotenv from 'dotenv';
dotenv.config();
import { connectDB, disconnectDB } from '../db';
import Plan from '../models/plan.model';

async function run() {
  await connectDB();
  console.log('Connected to DB for plan seeding');

  const count = await Plan.countDocuments();
  if (count > 0) {
    console.log('Plans already exist in DB, skipping seeder.');
    await disconnectDB();
    process.exit(0);
  }

  const plans = [
    {
      nombre: 'Plan Mensual',
      precio: 150000,
      descripcion: 'Acceso ilimitado al gimnasio durante 30 días.',
      beneficios: ['Acceso total a máquinas', 'Clases grupales básicas', 'Soporte en recepción'],
      popular: true,
      creadoPor: 'seed',
      actualizadoPor: 'seed',
    },
    {
      nombre: 'Plan Trimestral',
      precio: 400000,
      descripcion: 'Tres meses con precio preferencial.',
      beneficios: ['Acceso total', 'Clases ilimitadas', 'Evaluación física'],
      popular: false,
      creadoPor: 'seed',
      actualizadoPor: 'seed',
    },
    {
      nombre: 'Plan Semestral',
      precio: 750000,
      descripcion: 'Seis meses con ahorro importante.',
      beneficios: ['Acceso total', 'Clases premium', 'Asesoría mensual'],
      popular: false,
      creadoPor: 'seed',
      actualizadoPor: 'seed',
    },
  ];

  await Plan.insertMany(plans);
  console.log('Seeded plans:', plans.length);

  await disconnectDB();
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
