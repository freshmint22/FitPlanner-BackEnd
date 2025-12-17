import dotenv from 'dotenv';
dotenv.config();
import { connectDB, disconnectDB } from '../db';
import ClassModel from '../models/class.model';
import Member from '../models/member.model';
import Attendance from '../models/attendance.model';

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function run() {
  await connectDB();
  console.log('Connected to DB');

  let classes = await ClassModel.find().lean();
  if (!classes || classes.length === 0) {
    console.log('No classes found — creating sample classes');
    const samples = [
      { name: 'Funcional', instructorName: 'Laura Gómez', capacity: 20 },
      { name: 'Spinning', instructorName: 'Carlos Ruiz', capacity: 18 },
      { name: 'CrossFit', instructorName: 'Miguel Rojas', capacity: 25 },
      { name: 'Yoga', instructorName: 'Ana Pérez', capacity: 16 },
    ];
    const created = await ClassModel.insertMany(samples.map(s => ({ ...s, date: new Date() })));
    classes = created;
  }

  const members = await Member.find().lean();
  if (!members || members.length === 0) {
    console.log('No members found — cannot seed attendances');
    await disconnectDB();
    process.exit(1);
  }

  // Create attendance for the last 30 days
  const days = 30;
  const createdAttendances: any[] = [];

  for (const cls of classes) {
    // random number of sessions in the last 30 days
    const sessions = randomInt(4, 12);
    for (let s = 0; s < sessions; s++) {
      const dayOffset = randomInt(0, days - 1);
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);

      // random attendees up to capacity
      const attendeesCount = Math.min(cls.capacity || 20, randomInt(5, cls.capacity || 20));
      // pick random members
      const shuffled = members.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, attendeesCount);

      for (const m of selected) {
        createdAttendances.push({ memberId: m._id, classId: cls._id, date });
      }
    }
  }

  if (createdAttendances.length === 0) {
    console.log('No attendances to insert.');
    await disconnectDB();
    process.exit(0);
  }

  // Insert in batches
  const BATCH = 500;
  for (let i = 0; i < createdAttendances.length; i += BATCH) {
    const chunk = createdAttendances.slice(i, i + BATCH);
    await Attendance.insertMany(chunk);
    console.log(`Inserted ${i + chunk.length}/${createdAttendances.length}`);
  }

  console.log('Seeding attendances completed:', createdAttendances.length);
  await disconnectDB();
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
