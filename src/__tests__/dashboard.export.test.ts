import request from "supertest";
import app from "../app";
import mongoose from "mongoose";

import Payment from "../models/payment.model";
import Member from "../models/member.model";
import Attendance from "../models/attendance.model";
import jwt from "jsonwebtoken";

// ===================== TOKEN =====================
const genToken = (userId: string) =>
  jwt.sign(
    { id: userId, rol: "admin" },
    process.env.JWT_SECRET || "test-secret"
  );

// ===================== DB HOOKS =====================
beforeAll(async () => {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  await mongoose.connect(uri!);
});

beforeEach(async () => {
  await Payment.deleteMany({});
  await Member.deleteMany({});
  await Attendance.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// ===================================================
//              EXPORTACIÓN DEL DASHBOARD
// ===================================================
describe("EXPORTACIÓN DEL DASHBOARD", () => {

  // ===================================================
  //         TEST CSV
  // ===================================================
  it("Debe exportar correctamente el dashboard en CSV", async () => {

    const admin = await Member.create({
      firstName: "Admin",
      lastName: "Test",
      email: "admin@test.com",
      password: "123",
      rol: "admin",
      estado: "activo"
    });

    const token = genToken(admin._id.toString());

    // Crear un pago
    await Payment.create({
      memberId: admin._id.toString(),
      amount: 30000,
      date: new Date()
    });

    // Crear check-in
    await Attendance.create({
      memberId: admin._id.toString(),
      date: new Date()
    });

    const res = await request(app)
      .get("/reportes/dashboard-export-csv")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    // Validación headers
    expect(res.headers["content-type"]).toContain("text/csv");

    // Validación contenido real CSV
    expect(res.text).toContain("Métrica");
    expect(res.text).toContain("Valor");
    expect(res.text).toContain("Total miembros");
    expect(res.text).toContain("Ingresos del mes");
    expect(res.text).toContain("Check-ins hoy");
    expect(res.text).toContain("Retención (%)");
  });

  // ===================================================
  //         TEST PDF
  // ===================================================
  it("Debe exportar correctamente el dashboard en PDF", async () => {

    const admin = await Member.create({
      firstName: "Admin",
      lastName: "Test",
      email: "admin@test.com",
      password: "123",
      rol: "admin",
      estado: "activo"
    });

    const token = genToken(admin._id.toString());

    // Crear datos
    await Payment.create({
      memberId: admin._id.toString(),
      amount: 30000,
      date: new Date()
    });

    await Attendance.create({
      memberId: admin._id.toString(),
      date: new Date()
    });

    const res = await request(app)
      .get("/reportes/dashboard-export-pdf")
      .set("Authorization", `Bearer ${token}`)
      .buffer()
      .parse((res, callback) => {
        res.setEncoding("binary");
        let data = "";
        res.on("data", chunk => (data += chunk));
        res.on("end", () => callback(null, Buffer.from(data, "binary")));
      });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");

    // El PDF debe tener contenido
    expect(res.body.length).toBeGreaterThan(50);
  });

}); 
