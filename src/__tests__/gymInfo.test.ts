import request from "supertest";
import app from "../app";
import mongoose from "mongoose";

import Member from "../models/member.model";
import GymInfo from "../models/gymInfo.model";
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
  await GymInfo.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe("CONFIGURACIÓN DEL GIMNASIO", () => {
  let token: string;

  beforeEach(async () => {
    const admin = await Member.create({
      firstName: "Admin",
      lastName: "Test",
      email: "admin@test.com",
      password: "123",
      rol: "admin",
      estado: "activo"
    });

    token = genToken(admin._id.toString());
  });

  /* ===================================================
     TEST 1 → Guardar o actualizar información
     =================================================== */
  it("Debe crear o actualizar la información del gimnasio", async () => {
    const res = await request(app)
      .post("/configuracion/gimnasio")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nombre: "FitPlanner Gym",
        direccion: "Calle 123",
        telefono: "3001234567",
        horarios: "Lunes a viernes 6AM - 10PM"
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.nombre).toBe("FitPlanner Gym");
  });

  /* ===================================================
     TEST 2 → Obtener información del gimnasio
     =================================================== */
  it("Debe obtener la información del gimnasio si existe", async () => {
    await GymInfo.create({
      nombre: "FitPlanner",
      direccion: "Calle 10",
      telefono: "3009876543",
      horarios: "6AM - 9PM",
      updatedBy: "123"
    });

    const res = await request(app)
      .get("/configuracion/gimnasio")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.nombre).toBe("FitPlanner");
  });

  /* ===================================================
     TEST 3 → Validación de campos requeridos
     =================================================== */
  it("Debe rechazar si faltan campos requeridos", async () => {
    const res = await request(app)
      .post("/configuracion/gimnasio")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nombre: "",
        direccion: "",
        telefono: "",
        horarios: ""
      });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});
