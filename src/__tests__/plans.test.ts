import request from "supertest";
import app from "../app";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import Plan from "../models/plan.model";
import Member from "../models/member.model";

const genToken = (userId: string) =>
  jwt.sign(
    { id: userId, rol: "admin" },
    process.env.JWT_SECRET || "test-secret"
  );

let token = "";

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  await mongoose.connect(uri!);

  // Crear admin real
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

beforeEach(async () => {
  await Plan.deleteMany({});
  await Member.deleteMany({ _id: { $ne: null } }); // Evita borrar admin
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe("GESTIÓN DE PLANES", () => {

  it("Debe crear un plan de membresía correctamente", async () => {
    const res = await request(app)
      .post("/planes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nombre: "Premium",
        precio: 150000,
        descripcion: "Plan avanzado",
        beneficios: ["Zona de pesas", "Clases grupales"],
        popular: true
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.nombre).toBe("Premium");
  });

  it("Debe listar planes (activos e inactivos)", async () => {

    await Plan.create([
      {
        nombre: "Básico",
        precio: 90000,
        descripcion: "desc",
        beneficios: ["A"],
        estado: "activo",
        creadoPor: "admin",
        actualizadoPor: "admin"
      },
      {
        nombre: "Elite",
        precio: 240000,
        descripcion: "desc",
        beneficios: ["B"],
        estado: "inactivo",
        creadoPor: "admin",
        actualizadoPor: "admin"
      }
    ]);

    const res = await request(app)
      .get("/planes")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it("Debe listar solo los planes activos", async () => {

    await Plan.create([
      {
        nombre: "Básico",
        precio: 90000,
        descripcion: "desc",
        beneficios: ["A"],
        estado: "activo",
        creadoPor: "admin",
        actualizadoPor: "admin"
      },
      {
        nombre: "Elite",
        precio: 240000,
        descripcion: "desc",
        beneficios: ["B"],
        estado: "inactivo",
        creadoPor: "admin",
        actualizadoPor: "admin"
      }
    ]);

    const res = await request(app)
      .get("/planes/activos")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].estado).toBe("activo");
  });

  it("Debe editar un plan correctamente", async () => {

    const plan = await Plan.create({
      nombre: "Premium",
      precio: 150000,
      descripcion: "desc",
      beneficios: ["A"],
      estado: "activo",
      creadoPor: "admin",
      actualizadoPor: "admin"
    });

    const res = await request(app)
      .put(`/planes/${plan._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ precio: 200000 });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.precio).toBe(200000);
  });

  it("Debe deshabilitar un plan (estado inactivo)", async () => {

    const plan = await Plan.create({
      nombre: "Premium",
      precio: 150000,
      descripcion: "desc",
      beneficios: ["A"],
      estado: "activo",
      creadoPor: "admin",
      actualizadoPor: "admin"
    });

    const res = await request(app)
      .delete(`/planes/${plan._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    const updated = await Plan.findById(plan._id);
    expect(updated?.estado).toBe("inactivo");
  });

  it("Debe cambiar el plan del usuario correctamente", async () => {

    const user = await Member.create({
      firstName: "Usuario",
      email: "user@test.com",
      password: "123",
      rol: "user",
      estado: "activo"
    });

    const plan = await Plan.create({
      nombre: "Premium",
      precio: 150000,
      descripcion: "desc",
      beneficios: ["A"],
      estado: "activo",
      creadoPor: "admin",
      actualizadoPor: "admin"
    });

    const res = await request(app)
      .put(`/planes/usuario/${user._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ planId: plan._id });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.planActual).toBe(plan._id.toString());
  });

});
