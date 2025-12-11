import request from "supertest";
import app from "../app";
import mongoose from "mongoose";

import Payment from "../models/payment.model";
import Member from "../models/member.model";
import jwt from "jsonwebtoken";

const genToken = (userId: string) =>
  jwt.sign(
    { id: userId, rol: "admin" },
    process.env.JWT_SECRET || "test-secret"
  );

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    await mongoose.connect(uri!);
  }
});

beforeEach(async () => {
  await Payment.deleteMany({});
  await Member.deleteMany({});
});

afterAll(async () => {
  // global teardown handled by src/__tests__/jest.setup.ts
});

describe("GET /reportes/ingresos-mensuales", () => {

  it("Debe retornar los ingresos por cada mes del año", async () => {
    const admin = await Member.create({
      firstName: "Admin",
      lastName: "Test",
      email: "admin@test.com",
      password: "123",
      rol: "admin",
      estado: "activo"
    });

    const token = genToken(admin._id.toString());

    // ENERO
    await Payment.create({
      memberId: admin._id.toString(),
      amount: 10000,
      date: new Date("2025-01-15")
    });

    // MARZO
    await Payment.create({
      memberId: admin._id.toString(),
      amount: 20000,
      date: new Date("2025-03-10")
    });

    const res = await request(app)
      .get("/reportes/ingresos-mensuales")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const meses = res.body.data;

    // 12 meses
    expect(meses.length).toBe(12);

    expect(meses[0].monto).toBe(10000); // Enero
    expect(meses[2].monto).toBe(20000); // Marzo
    expect(meses[1].monto).toBe(0);     // Febrero vacío
  });

});
