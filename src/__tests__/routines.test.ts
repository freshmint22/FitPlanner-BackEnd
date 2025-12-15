import request from "supertest";
import app from "../app";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import Member from "../models/member.model";
import Routine from "../models/routine.model";

// 🔑 Generar token igual que en tus otros tests
const genToken = (userId: string) => {
  return jwt.sign(
    { id: userId, rol: "user" },
    process.env.JWT_SECRET || "dev-secret",
    { algorithm: "HS256" }
  );
};

// ---------------------------
// SETUP / TEARDOWN
// ---------------------------
beforeEach(async () => {
  await Member.deleteMany({});
  await Routine.deleteMany({});
});

// ---------------------------
// TESTS
// ---------------------------
describe("POST /routines – Crear rutina con IA", () => {

  it("debe crear una rutina con IA y guardarla correctamente", async () => {

    const hashed = await bcrypt.hash("123456", 10);

    // 👤 Crear usuario
    const user = await Member.create({
      firstName: "Laura",
      lastName: "IA",
      email: "laura.ia@test.com",
      password: hashed,
      rol: "user",
      estado: "activo"
    });

    const token = genToken(user._id.toString());

    // 🤖 Crear rutina con IA
    const res = await request(app)
      .post("/routines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nombre: "Hipertrofia tren superior",
        diasPorSemana: 3,
        objetivo: "hipertrofia",
        enfoque: ["pecho", "espalda", "brazos"],
        nivel: "intermedio"
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.nombre).toBe("Hipertrofia tren superior");
    expect(res.body.data.diasPorSemana).toBe(3);
    expect(res.body.data.estado).toBe("activa");

    // 🗄️ Verificar que quedó guardada en DB
    const rutina = await Routine.findOne({ usuario: user._id });

    expect(rutina).not.toBeNull();
    expect(rutina?.objetivo).toBe("hipertrofia");
    expect(rutina?.dias.length).toBeGreaterThan(0);
  });

});

describe("GET /routines – Listar rutinas del usuario", () => {

  it("debe listar las rutinas del usuario autenticado", async () => {

    const hashed = await bcrypt.hash("123456", 10);

    const user = await Member.create({
      firstName: "Valen",
      lastName: "List",
      email: "valen@test.com",
      password: hashed,
      rol: "user",
      estado: "activo"
    });

    const token = genToken(user._id.toString());

    // Crear rutina directa en DB
    await Routine.create({
      usuario: user._id,
      nombre: "Definición y resistencia",
      diasPorSemana: 4,
      objetivo: "fuerza",
      enfoque: ["core"],
      nivel: "básico",
      dias: [{ dia: 1, ejercicios: [] }],
      estado: "activa"
    });

    const res = await request(app)
      .get("/routines")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].nombre).toBe("Definición y resistencia");
  });

});
