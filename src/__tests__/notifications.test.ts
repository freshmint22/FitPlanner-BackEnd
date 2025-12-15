import request from "supertest";
import app from "../app";
import mongoose from "mongoose";

import Member from "../models/member.model";
import NotificationConfig from "../models/notificationConfig.model";
import jwt from "jsonwebtoken";

/* ===================================================
   Helper para generar token de admin
   =================================================== */
const genToken = (userId: string) =>
  jwt.sign(
    { id: userId, rol: "admin" },
    process.env.JWT_SECRET || "test-secret"
  );

/* ===================================================
   Conexión a BD antes de los tests
   =================================================== */
beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    await mongoose.connect(uri!);
  }
});

/* ===================================================
   Limpieza antes de cada test
   =================================================== */
beforeEach(async () => {
  await Member.deleteMany({});
  await NotificationConfig.deleteMany({});
});

/* ===================================================
   Cierre de BD al finalizar
   =================================================== */
afterAll(async () => {
  // global teardown handled by src/__tests__/jest.setup.ts
});

/* ===================================================
   PRUEBAS DE CONFIGURACIÓN DE NOTIFICACIONES
   =================================================== */
describe("CONFIGURACIÓN DE NOTIFICACIONES", () => {
  let token: string;

  /* ===================================================
     Crear admin y generar token antes de cada test
     =================================================== */
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
     TEST 1 → Guardar configuración
     =================================================== */
  it("Debe guardar la configuración de notificaciones", async () => {
    const res = await request(app)
      .post("/configuracion/notificaciones")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tipo: "email",
        frecuencia: "diaria",
        habilitado: true
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.tipo).toBe("email");

    const saved = await NotificationConfig.findOne();
    expect(saved).not.toBeNull();
    expect(saved?.frecuencia).toBe("diaria");
  });

  /* ===================================================
     TEST 2 → Obtener configuración
     =================================================== */
  it("Debe obtener la configuración si existe", async () => {
    await NotificationConfig.create({
      tipo: "push",
      frecuencia: "mensual",
      habilitado: true,
      adminId: "123"
    });

    const res = await request(app)
      .get("/configuracion/notificaciones")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.tipo).toBe("push");
  });

  /* ===================================================
     TEST 3 → Enviar prueba de notificación
     =================================================== */
  it("Debe simular el envío de prueba de notificación", async () => {
    await NotificationConfig.create({
      tipo: "interna",
      frecuencia: "semanal",
      habilitado: true,
      adminId: "123"
    });

    const res = await request(app)
      .post("/configuracion/notificaciones/prueba")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.mensaje).toContain("interna");
    expect(res.body.data.fecha).toBeDefined();
  });
});
