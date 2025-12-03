import request from 'supertest';
import app from '../src/app';
import { connectDB, disconnectDB } from '../src/db';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Members API (integration)', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) await mongoServer.stop();
  });

  it('GET /api/miembros returns 200 and data array', async () => {
    const res = await request(app).get('/api/miembros').expect(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
