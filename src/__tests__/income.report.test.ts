import request from "supertest";
import app from "../app";
import mongoose from "mongoose";
import Payment from "../models/payment.model";
import Member from "../models/member.model";

interface IncomeItem {
  mes: number;
  año: number;
  total: number;
}

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

describe("GET /reportes/ingresos – Validación de datos reales", () => {
  it("debe calcular correctamente ingresos mensuales y acumulado", async () => {

    // Crear miembro
    const member = await Member.create({
      firstName: "Test",
      lastName: "User",
      email: "test@test.com",
      password: "123456",
      rol: "user",
      estado: "activo"
    });

    // Crear pagos
    await Payment.create([
      { amount: 50000, date: new Date("2025-01-10"), memberId: member._id },
      { amount: 30000, date: new Date("2025-01-20"), memberId: member._id },
      { amount: 45000, date: new Date("2025-02-05"), memberId: member._id }
    ]);

    const res = await request(app).get("/reportes/ingresos");

    expect(res.status).toBe(200);

    const mensual: IncomeItem[] = res.body.data.mensual;

    expect(mensual.length).toBe(2); // enero y febrero

    const enero = mensual.find((m: IncomeItem) => m.mes === 1);
    const febrero = mensual.find((m: IncomeItem) => m.mes === 2);

    expect(enero!.total).toBe(80000);  // 50k + 30k
    expect(febrero!.total).toBe(45000);

    expect(res.body.data.totalAcumulado).toBe(125000);
  });

  it("debe filtrar ingresos por rango de fechas", async () => {

    const member = await Member.create({
      firstName: "Filter",
      lastName: "User",
      email: "filter@test.com",
      password: "123456",
      rol: "user",
      estado: "activo"
    });

    await Payment.create([
      { amount: 20000, date: new Date("2025-01-05"), memberId: member._id },
      { amount: 30000, date: new Date("2025-02-10"), memberId: member._id }
    ]);

    const res = await request(app)
      .get("/reportes/ingresos?startDate=2025-02-01&endDate=2025-02-28");

    expect(res.status).toBe(200);

    const mensual: IncomeItem[] = res.body.data.mensual;

    expect(mensual.length).toBe(1);
    expect(mensual[0].total).toBe(30000);
  });
});
