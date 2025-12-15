import request from 'supertest';
import app from '../app';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import ClassModel from '../models/class.model';
import ReservationModel from '../models/reservation.model';

const adminToken = jwt.sign({ id: 'admin-id', rol: 'admin' }, process.env.JWT_SECRET || 'dev-secret');
const userToken = jwt.sign({ id: 'user-id', rol: 'user' }, process.env.JWT_SECRET || 'dev-secret');

describe('Classes persistence (integration)', () => {
  jest.setTimeout(20000);

  let mongod: any | undefined;
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) return;

    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const uriEnv = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (uriEnv) {
      await mongoose.connect(uriEnv);
      return;
    }

    // start an ephemeral in-memory mongo for this test if none configured
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);
  });

  beforeEach(async () => {
    await ClassModel.deleteMany({});
    await ReservationModel.deleteMany({});
  });

  afterAll(async () => {
    if (mongod) {
      try {
        await mongoose.connection.dropDatabase();
      } catch (e) {
        // ignore
      }
      try {
        await mongoose.connection.close();
      } catch (e) {
        // ignore
      }
      try {
        await mongod.stop();
      } catch (e) {
        // ignore
      }
    }
  });

  it('creates a class and allows reservations until capacity is reached', async () => {
    // create class with capacity 2
    const createRes = await request(app)
      .post('/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Yoga', description: 'Morning', capacity: 2 });

    expect(createRes.status).toBe(201);
    const classId = createRes.body.id;

    // first reservation by user-id
    const r1 = await request(app)
      .post(`/classes/${classId}/reservations`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({});
    expect(r1.status).toBe(201);

    // second reservation by another user
    const otherToken = jwt.sign({ id: 'user-2', rol: 'user' }, process.env.JWT_SECRET || 'dev-secret');
    const r2 = await request(app)
      .post(`/classes/${classId}/reservations`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({});
    expect(r2.status).toBe(201);

    // third reservation should fail with class_full / 409
    const r3 = await request(app)
      .post(`/classes/${classId}/reservations`)
      .set('Authorization', `Bearer ${jwt.sign({ id: 'user-3', rol: 'user' }, process.env.JWT_SECRET || 'dev-secret')}`)
      .send({});
    expect(r3.status).toBe(409);

    // admin can list reservations
    const list = await request(app)
      .get(`/classes/${classId}/reservations`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.items)).toBe(true);
    expect(list.body.total).toBe(2);
  });

  it('prevents duplicate reservations by same user', async () => {
    const createRes = await request(app)
      .post('/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Pilates', capacity: 5 });
    const classId = createRes.body.id;

    const first = await request(app)
      .post(`/classes/${classId}/reservations`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({});
    expect(first.status).toBe(201);

    const dup = await request(app)
      .post(`/classes/${classId}/reservations`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({});
    expect(dup.status).toBe(409);
  });
});
