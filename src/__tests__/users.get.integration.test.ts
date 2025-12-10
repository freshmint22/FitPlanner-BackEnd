import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app';
import * as crypto from 'crypto';
import Member from '../models/member.model';

jest.setTimeout(60_000);

describe('GET /api/users/:id (integration)', () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri, { dbName: 'test' });
  });

  beforeEach(async () => {
    await Member.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });

  const base64Url = (input: string) =>
    Buffer.from(input)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  const makeToken = (payload: object) => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const headerB64 = base64Url(JSON.stringify(header));
    const payloadB64 = base64Url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }));
    const data = `${headerB64}.${payloadB64}`;
    const sig = crypto.createHmac('sha256', secret).update(data).digest('base64');
    const sigB64 = sig.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `${data}.${sigB64}`;
  };

  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/users/507f1f77bcf86cd799439011');
    expect(res.status).toBe(401);
  });

  test('returns 400 for invalid id format', async () => {
    const token = makeToken({ id: 'u1', email: 'u1@example.com', rol: 'admin' });
    const res = await request(app)
      .get('/api/users/invalid-id')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  test('allows admin to fetch another profile', async () => {
    const created = await Member.create({ firstName: 'Ana', lastName: 'User', email: 'ana@example.com', password: 'pass', rol: 'user', estado: 'activo' });
    const token = makeToken({ id: 'admin', email: 'admin@example.com', rol: 'admin' });

    const res = await request(app)
      .get(`/api/users/${created._id.toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('item');
    expect(res.body.item).toHaveProperty('email', 'ana@example.com');
  });

  test('forbids other users from fetching someone else profile', async () => {
    const created = await Member.create({ firstName: 'Bob', lastName: 'User', email: 'bob@example.com', password: 'pass', rol: 'user', estado: 'activo' });
    const other = await Member.create({ firstName: 'Eve', lastName: 'Other', email: 'eve@example.com', password: 'pass', rol: 'user', estado: 'activo' });
    const token = makeToken({ id: other._id.toString(), email: other.email, rol: 'user' });

    const res = await request(app)
      .get(`/api/users/${created._id.toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test('allows user to fetch own profile', async () => {
    const created = await Member.create({ firstName: 'Self', lastName: 'User', email: 'self@example.com', password: 'pass', rol: 'user', estado: 'activo' });
    const token = makeToken({ id: created._id.toString(), email: created.email, rol: 'user' });

    const res = await request(app)
      .get(`/api/users/${created._id.toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.item).toHaveProperty('email', 'self@example.com');
  });
});
