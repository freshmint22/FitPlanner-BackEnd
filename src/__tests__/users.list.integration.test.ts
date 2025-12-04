import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app';
import Member from '../models/member.model';

jest.setTimeout(60_000);

describe('GET /api/users (integration)', () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri, { dbName: 'test' });
  });

  beforeEach(async () => {
    await Member.deleteMany({});
    const docs = [];
    for (let i = 0; i < 25; i++) {
      docs.push({ nombre: `User ${i}`, email: `user${i}@example.com`, rol: i % 5 === 0 ? 'admin' : 'user', estado: 'activo' });
    }
    await Member.insertMany(docs);
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
    const crypto = require('crypto');
    const sig = crypto.createHmac('sha256', secret).update(data).digest('base64');
    const sigB64 = sig.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `${data}.${sigB64}`;
  };

  test('requires authentication', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('forbids non-admin users', async () => {
    const token = await makeToken({ id: 'u1', email: 'u1@example.com', rol: 'user' });
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('returns paginated list for admin', async () => {
    const token = await makeToken({ id: 'admin', email: 'admin@example.com', rol: 'admin' });
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(res.body.items.length).toBeLessThanOrEqual(10);
    expect(res.body.total).toBe(25);
  });
});
