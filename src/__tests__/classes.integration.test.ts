import request from 'supertest';
import app from '../app';
import Member from '../models/member.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (uri) await mongoose.connect(uri);
});

afterAll(async () => {
  // global teardown handled by src/__tests__/jest.setup.ts
});

jest.setTimeout(30000);

describe('Classes routes (integration)', () => {
  it('admin can create a class and users can reserve until capacity', async () => {
    // create admin user
    const hashed = await bcrypt.hash('AdminPass1', 10);
    const admin = await Member.create({ firstName: 'Adm', email: 'adm@test.com', password: hashed, rol: 'admin', estado: 'activo' });
    const adminToken = jwt.sign({ id: admin._id.toString(), rol: 'admin' }, process.env.JWT_SECRET || 'dev-secret', { algorithm: 'HS256' as any });

    // create a class with capacity 2
    const resCreate = await request(app).post('/classes').set('Authorization', `Bearer ${adminToken}`).send({ title: 'Yoga', capacity: 2, schedule: new Date().toISOString() });
    expect(resCreate.status).toBe(201);
    const classId = resCreate.body.id;

    // create two users and reserve
    for (let i = 0; i < 2; i++) {
      const hashedU = await bcrypt.hash('UserPass1', 10);
      const user = await Member.create({ firstName: `User${i}`, email: `user${i}@test.com`, password: hashedU, rol: 'user', estado: 'activo' });
      const token = jwt.sign({ id: user._id.toString(), rol: 'user' }, process.env.JWT_SECRET || 'dev-secret', { algorithm: 'HS256' as any });

      const r = await request(app).post(`/classes/${classId}/reservations`).set('Authorization', `Bearer ${token}`).send({});
      expect(r.status).toBe(201);
    }

    // third user should get 409 (capacity full)
    const hashedU = await bcrypt.hash('UserPass1', 10);
    const user3 = await Member.create({ firstName: `User3`, email: `user3@test.com`, password: hashedU, rol: 'user', estado: 'activo' });
    const token3 = jwt.sign({ id: user3._id.toString(), rol: 'user' }, process.env.JWT_SECRET || 'dev-secret', { algorithm: 'HS256' as any });
    const r3 = await request(app).post(`/classes/${classId}/reservations`).set('Authorization', `Bearer ${token3}`).send({});
    expect(r3.status).toBe(409);
  });
});
