import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load env (optional override) — jest will set NODE env and root dir
dotenv.config({ path: '.env.test' });

import Member from '../models/member.model';
import ClassModel from '../models/class.model';
import Routine from '../models/routine.model';
import NotificationConfig from '../models/notificationConfig.model';
import RoutineAssignment from '../models/routineAssignment.model';

// Increase default jest timeout for slow CI environments
jest.setTimeout(120000);

// Allow non-strict queries (helps some mongoose versions in tests)
mongoose.set('strictQuery', false);

let mongoServer: MongoMemoryServer | null = null;

// Exportable helpers for tests that need manual connect/disconnect
export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
  }
  const mongoUri = process.env.MONGODB_URI!;
  await mongoose.connect(mongoUri);
}

export async function disconnectDB() {
  try {
    if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
  } catch (e) {
    // ignore
  }
  try {
    if (mongoose.connection.readyState === 1) await mongoose.connection.close();
  } catch (e) {
    // ignore
  }
  if (mongoServer) {
    try {
      await mongoServer.stop();
    } catch (e) {
      // ignore
    }
    mongoServer = null;
  }
}

// Seed helper — creates minimal data required by tests
export async function seedData() {
  // wipe all collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const coll of collections) {
    try {
      await mongoose.connection.db.collection(coll.name).deleteMany({});
    } catch (e) {
      // ignore
    }
  }

  // create admin and user
  const admin = await Member.create({
    firstName: 'Admin',
    email: 'admin@example.com',
    password: 'hashedpassword',
    rol: 'admin',
    estado: 'activo',
  });

  const user = await Member.create({
    firstName: 'User',
    email: 'user@example.com',
    password: 'hashedpassword',
    rol: 'user',
    estado: 'activo',
  });

  // classes
  await ClassModel.create([
    { title: 'Yoga Básico', trainerId: admin._id, capacity: 10 },
    { title: 'Cardio Intenso', trainerId: admin._id, capacity: 15 },
  ]);

  // routines
  await Routine.create([
    { name: 'Rutina 1', trainerId: admin._id, exercises: [{ name: 'Push Ups', sets: 3, reps: 12 }] },
    { name: 'Rutina 2', trainerId: admin._id, exercises: [{ name: 'Squats', sets: 3, reps: 15 }] },
  ]);

  // notifications
  await NotificationConfig.create([
    { tipo: 'email', frecuencia: 'diaria', habilitado: true, adminId: admin._id.toString() },
  ]);

  return { admin, user };
}

// Helper to create JWT token from a seeded user document
export function createTestToken(user: any) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign({ id: user._id?.toString ? user._id.toString() : user._id, rol: user.rol || user.role }, secret, { algorithm: 'HS256' as any, expiresIn: '1h' });
}

// Expose seeded users for tests to import (populated in beforeAll / beforeEach)
export let seededAdmin: any = null;
export let seededUser: any = null;

// Jest lifecycle hooks
beforeAll(async () => {
  // Start in-memory mongo and connect
  await connectDB();
  // Seed initial data once
  const s = await seedData();
  seededAdmin = s.admin;
  seededUser = s.user;
});

// Reset database to seeded state before each test for isolation
beforeEach(async () => {
  const s = await seedData();
  seededAdmin = s.admin;
  seededUser = s.user;
});

afterAll(async () => {
  // Tear down
  await disconnectDB();
});
