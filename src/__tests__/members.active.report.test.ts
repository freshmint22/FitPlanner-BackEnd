import request from "supertest";
import app from "../app";
import mongoose from "mongoose";

import Member from "../models/member.model";
import Payment from "../models/payment.model";
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
  await Member.deleteMany({});
  await Payment.deleteMany({});
});

afterAll(async () => {
  // global teardown handled by src/__tests__/jest.setup.ts
});

describe("GET /reportes/miembros-activos", () => {
  let token: string;

  beforeEach(async () => {
    const admin = await Member.create({
      firstName: "Admin",
      lastName: "Test",
      email: "admin@test.com",
      password: "123456",
      rol: "admin",
      estado: "activo"
    });

    token = genToken(admin._id.toString());
  });

  /* ===================================================
     TEST 1 → Estado del miembro
     =================================================== */
  it("Debe retornar miembros con su estado calculado correctamente", async () => {
    const miembro1 = await Member.create({
      firstName: "Ana",
      lastName: "Torres",
      email: "ana@test.com",
      password: "123456",
      rol: "user",
      estado: "activo"
    });

    const miembro2 = await Member.create({
      firstName: "Carlos",
      lastName: "Lopez",
      email: "carlos@test.com",
      password: "123456",
      rol: "user",
      estado: "activo"
    });

    await Payment.create({
      memberId: miembro1._id.toString(),
      amount: 30000,
      date: new Date(),
      method: "Simulado"
    });

    const res = await request(app)
      .get("/reportes/miembros-activos")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const miembros = res.body.miembros;
    expect(miembros.length).toBe(3);

    const ana = miembros.find((m: any) => m.correo === "ana@test.com");
    expect(ana).toBeDefined();
    expect(["Activa", "Por vencer", "Vencida"]).toContain(ana.estado);

    const carlos = miembros.find((m: any) => m.correo === "carlos@test.com");
    expect(carlos).toBeDefined();
    expect(carlos.estado).toBe("Sin pagos registrados");
  });

  /* ===================================================
     TEST 2 → Búsqueda por nombre / correo
     =================================================== */
  it("Debe filtrar miembros por nombre, apellido o correo usando ?search=", async () => {
    await Member.create([
      {
        firstName: "Ana",
        lastName: "Torres",
        email: "ana@test.com",
        password: "123456",
        rol: "user",
        estado: "activo"
      },
      {
        firstName: "Daniela",
        lastName: "Gomez",
        email: "daniela@example.com",
        password: "123456",
        rol: "user",
        estado: "activo"
      },
      {
        firstName: "Pedro",
        lastName: "Ramirez",
        email: "pedro@test.com",
        password: "123456",
        rol: "user",
        estado: "activo"
      }
    ]);

    /* Buscar por nombre "ana" */
    const res1 = await request(app)
      .get("/reportes/miembros-activos?search=ana")
      .set("Authorization", `Bearer ${token}`);

    expect(res1.status).toBe(200);
    expect(res1.body.miembros.length).toBe(1);
    expect(res1.body.miembros[0].correo).toBe("ana@test.com");

    /* Buscar por apellido "gomez" */
    const res2 = await request(app)
      .get("/reportes/miembros-activos?search=gomez")
      .set("Authorization", `Bearer ${token}`);

    expect(res2.status).toBe(200);
    expect(res2.body.miembros.length).toBe(1);
    expect(res2.body.miembros[0].correo).toBe("daniela@example.com");

    /* Buscar por correo parcial "test" */
    const res3 = await request(app)
      .get("/reportes/miembros-activos?search=test")
      .set("Authorization", `Bearer ${token}`);

    expect(res3.status).toBe(200);
    expect(res3.body.miembros.length).toBe(3);

    /* Buscar algo que no existe */
    const res4 = await request(app)
      .get("/reportes/miembros-activos?search=inexistente")
      .set("Authorization", `Bearer ${token}`);

    expect(res4.status).toBe(200);
    expect(res4.body.miembros.length).toBe(0);
  });

  /* ===================================================
     TEST 3 → Exportación a Excel
     =================================================== */
  it("Debe exportar correctamente el archivo Excel de miembros activos", async () => {
    await Member.create([
      { firstName: "Ana", lastName: "Torres", email: "ana@test.com", password: "123", rol: "user", estado: "activo" },
      { firstName: "Pedro", lastName: "Ramirez", email: "pedro@test.com", password: "123", rol: "user", estado: "activo" }
    ]);

    const res = await request(app)
      .get("/reportes/miembros-activos/excel")
      .set("Authorization", `Bearer ${token}`)
      .buffer()
      .parse((res, callback) => {
        res.setEncoding("binary");
        let data = "";
        res.on("data", chunk => (data += chunk));
        res.on("end", () => callback(null, Buffer.from(data, "binary")));
      });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(res.headers["content-disposition"]).toContain("miembros_activos.xlsx");

    // El archivo Excel debe tener contenido (no vacío)
    expect(res.body.length).toBeGreaterThan(100);
  });
});
