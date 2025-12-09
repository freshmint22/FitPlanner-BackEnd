import request from "supertest";
import app from "../app";
import mongoose from "mongoose";
import Attendance from "../models/attendance.model";
import Member from "../models/member.model";
import jwt from "jsonwebtoken";

// Igual que tu backend
const genToken = (userId: string) =>
  jwt.sign(
    { id: userId, rol: "user" },
    process.env.JWT_SECRET || "test-secret"
  );

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  await mongoose.connect(uri!);
});

// ⭐ LIMPIAR TODO ANTES DE CADA TEST (igual que change password)
beforeEach(async () => {
  await Attendance.deleteMany({});
  await Member.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe("GET /api/attendances/list", () => {
  let userId: string;
  let token: string;

  beforeEach(async () => {
    // Crear usuario real en DB
    const user = await Member.create({
      firstName: "Valen",
      lastName: "Test",
      email: "valen@test.com",
      password: "123456",
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
    // 🔥 Ahora sí enviamos un ObjectId válido (NO un string cualquiera)
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
