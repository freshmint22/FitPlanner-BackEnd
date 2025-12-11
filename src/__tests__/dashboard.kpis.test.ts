import request from "supertest";
import app from "../app";
import mongoose from "mongoose";

import Member from "../models/member.model";
import Payment from "../models/payment.model";
import Attendance from "../models/attendance.model";
import jwt from "jsonwebtoken";

const genToken = (userId: string) =>
  jwt.sign(
    { id: userId, rol: "admin" },
    process.env.JWT_SECRET || "test-secret"
  );

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  await mongoose.connect(uri!);
});

beforeEach(async () => {
  await Member.deleteMany({});
  await Payment.deleteMany({});
  await Attendance.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe("GET /reportes/dashboard-kpis", () => {

  it("Debe retornar los KPIs principales del dashboard", async () => {
    // Crear miembros
    const admin = await Member.create({
      firstName: "Admin",
      lastName: "Test",
      email: "admin@test.com",
      password: "123",
      rol: "admin",
      estado: "activo"
    });

    await Member.create({
      firstName: "User",
      lastName: "Test",
      email: "user@test.com",
      password: "123",
      rol: "user",
      estado: "activo"
    });

    const token = genToken(admin._id.toString());

    // Pagos del mes
    await Payment.create({
      memberId: admin._id.toString(),
      amount: 30000,
      date: new Date()
    });

    // Asistencias de hoy
    await Attendance.create([
      { memberId: new mongoose.Types.ObjectId(), classId: new mongoose.Types.ObjectId(), date: new Date() },
      { memberId: new mongoose.Types.ObjectId(), classId: new mongoose.Types.ObjectId(), date: new Date() }
    ]);

    const res = await request(app)
      .get("/reportes/dashboard-kpis")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const data = res.body.data;

    expect(data.totalMiembros).toBe(2);
    expect(data.ingresosMes).toBe(30000);
    expect(data.checkinsHoy).toBe(2);
    expect(data.retencion).toBeDefined();
  });
});
