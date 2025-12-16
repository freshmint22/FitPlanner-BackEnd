import dotenv from 'dotenv';
dotenv.config();
import { connectDB, disconnectDB } from './db';
import Member from './models/member.model';
import ClassModel from './models/class.model';

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
      const bulk: Array<Record<string, unknown>> = [];
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
        // bulkWrite expects specific bulk operation types; narrow cast to avoid type errors
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await Member.bulkWrite(bulk as any);
      }
      console.log(`Seeded ${seedCount} users (including ${base.length} base users)`);
    } else {
      console.log('Seeded base users');
    }

    console.log('Seeding completed');

    // --- Seed some persistent classes for the app UI ---
    // helper: get next date for a given weekday (0=Sunday..6=Saturday) at provided hour/minute
    const nextWeekdayDate = (weekday: number, hour = 9, minute = 0) => {
      const today = new Date();
      const result = new Date(today);
      const diff = (weekday + 7 - result.getDay()) % 7;
      result.setDate(result.getDate() + (diff === 0 ? 7 : diff)); // next occurrence (if today, choose next week)
      result.setHours(hour, minute, 0, 0);
      return result;
    };

    const classes = [
      { name: 'Yoga Matutino', title: 'Yoga Matutino', description: 'Clase suave para activar el cuerpo y estirar', capacity: 20, schedule: nextWeekdayDate(1, 7, 0), instructorName: 'María Silva', room: 'Sala B' },
      { name: 'Spinning', title: 'Spinning', description: 'Entrenamiento cardiovascular de alta intensidad', capacity: 25, schedule: nextWeekdayDate(2, 18, 30), instructorName: 'Juan Pérez', room: 'Sala de Ciclismo' },
      { name: 'Funcional Full Body', title: 'Funcional Full Body', description: 'Entrenamiento combinado de fuerza y cardio', capacity: 20, schedule: nextWeekdayDate(1, 6, 0), instructorName: 'Laura Gómez', room: 'Sala 2' },
      { name: 'Pilates Suave', title: 'Pilates Suave', description: 'Movimientos controlados para mejorar postura', capacity: 15, schedule: nextWeekdayDate(3, 9, 0), instructorName: 'Ana Torres', room: 'Sala A' },
      { name: 'HIIT Express', title: 'HIIT Express', description: 'Intervalos cortos y potentes', capacity: 20, schedule: nextWeekdayDate(4, 12, 0), instructorName: 'Carlos Ruiz', room: 'Sala 1' },
      { name: 'Zumba', title: 'Zumba', description: 'Baile y cardio al ritmo latino', capacity: 30, schedule: nextWeekdayDate(5, 19, 0), instructorName: 'Sofía Martínez', room: 'Sala B' },
      { name: 'BodyPump', title: 'BodyPump', description: 'Entrenamiento con barras y pesas', capacity: 22, schedule: nextWeekdayDate(6, 17, 0), instructorName: 'Miguel Ramos', room: 'Sala Principal' },
      { name: 'Core & Stretch', title: 'Core & Stretch', description: 'Fortalecimiento del core y estiramientos', capacity: 18, schedule: nextWeekdayDate(1, 8, 30), instructorName: 'Laura Vega', room: 'Sala 2' },
      { name: 'TRX', title: 'TRX', description: 'Entrenamiento en suspensión', capacity: 12, schedule: nextWeekdayDate(3, 20, 0), instructorName: 'Andrés Melo', room: 'Zona Functional' },
      { name: 'Boxing', title: 'Boxing', description: 'Técnica y acondicionamiento', capacity: 20, schedule: nextWeekdayDate(4, 21, 0), instructorName: 'Diego Flores', room: 'Sala de Combate' },
      // Latin / dance classes across the week
      { name: 'Salsa Social', title: 'Salsa Social', description: 'Ritmos de salsa para todos los niveles', capacity: 25, schedule: nextWeekdayDate(1, 20, 0), instructorName: 'Rosa Díaz', room: 'Sala Dance' },
      { name: 'Bachata Sensual', title: 'Bachata Sensual', description: 'Técnica y conexión', capacity: 20, schedule: nextWeekdayDate(2, 20, 0), instructorName: 'Luis Herrera', room: 'Sala Dance' },
      { name: 'Merengue Energetico', title: 'Merengue', description: 'Clase dinámica y divertida', capacity: 30, schedule: nextWeekdayDate(3, 18, 0), instructorName: 'Mariana Cruz', room: 'Sala B' },
      { name: 'Reggaeton Fit', title: 'Reggaeton Fit', description: 'Cardio al ritmo urbano', capacity: 28, schedule: nextWeekdayDate(4, 19, 30), instructorName: 'Andrés Ramos', room: 'Sala 1' },
      { name: 'Kizomba Flow', title: 'Kizomba Flow', description: 'Movimiento suave y técnica', capacity: 18, schedule: nextWeekdayDate(5, 18, 30), instructorName: 'Sonia López', room: 'Sala Dance' },
      { name: 'Tango Argentino', title: 'Tango Argentino', description: 'Postura y abrazo', capacity: 16, schedule: nextWeekdayDate(6, 19, 0), instructorName: 'Pablo Ruiz', room: 'Sala A' },
      { name: 'Samba Ritmo', title: 'Samba Ritmo', description: 'Ritmos brasileños y energía', capacity: 30, schedule: nextWeekdayDate(0, 17, 0), instructorName: 'Camila Silva', room: 'Sala B' }
    ];

    for (const c of classes) {
      await ClassModel.updateOne({ name: c.name }, { $set: c }, { upsert: true });
    }
    console.log('Seeded classes');
  } catch (err) {
    console.error('Seeding failed', err);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

seed();
