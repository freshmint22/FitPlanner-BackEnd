import request from "supertest";
import app from "../app";
import mongoose from "mongoose";
import { MongoMemoryServer } from 'mongodb-memory-server';
import Attendance from "../models/attendance.model";
import Member from "../models/member.model";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const genToken = (userId: string) =>
  jwt.sign(
    { id: userId, rol: "user" },
    process.env.JWT_SECRET || "test-secret"
  );

let mongo: MongoMemoryServer;
beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri);
  }
});

beforeEach(async () => {
  await Attendance.deleteMany({});
  await Member.deleteMany({});
});

afterAll(async () => {
  if (mongo) {
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
      await mongo.stop();
    } catch (e) {
      // ignore
    }
  }
});

describe("GET /api/attendances/list", () => {
  let userId: string;
  let token: string;

  beforeEach(async () => {

    const hashed = await bcrypt.hash("123456", 10);

    const user = await Member.create({
      firstName: "Valen",
      lastName: "Test",
      email: "valen@test.com",
      password: hashed,
      rol: "user",
      estado: "activo",
    });

    userId = user._id.toString();
    token = genToken(userId);

    await Attendance.create([
      { memberId: userId, date: new Date("2025-01-01") },
      { memberId: userId, date: new Date("2025-01-15") },
      { memberId: userId, date: new Date("2025-02-01") },
    ]);
  });

  it("Debe obtener todo el historial del usuario", async () => {
    const res = await request(app)
      .get("/api/attendances/list")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(3);
  });

  it("Debe filtrar historial entre fechas", async () => {
    const res = await request(app)
      .get("/api/attendances/list?startDate=2025-01-10&endDate=2025-01-31")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
  });

  it("Debe evitar que un usuario vea asistencias de otro usuario", async () => {
    const anotherId = new mongoose.Types.ObjectId().toString();
    const anotherToken = genToken(anotherId);

    const res = await request(app)
      .get("/api/attendances/list")
      .set("Authorization", `Bearer ${anotherToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(0);
  });
});
