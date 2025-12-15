import request from "supertest";
import app from "../app";
import mongoose from "mongoose";
import Member from "../models/member.model";
import bcrypt from "bcryptjs";

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  await mongoose.connect(uri!);
});

beforeEach(async () => {
  await Member.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe("AUTH – Recuperación de contraseña", () => {

  /* ===================================================
     TEST 1 → Generar token de recuperación
     =================================================== */
  it("Debe generar un token de recuperación para un correo existente", async () => {

    const hashed = await bcrypt.hash("123456", 10);

    await Member.create({
      firstName: "Laura",
      lastName: "User",
      email: "laura@gmail.com",
      password: hashed,
      rol: "user",
      estado: "activo"
    });

    const res = await request(app)
      .post("/auth/forgot-password")
      .send({ email: "laura@gmail.com" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const user = await Member.findOne({ email: "laura@gmail.com" });
    expect(user).not.toBeNull();
    expect(user?.resetPasswordToken).toBeDefined();
    expect(user?.resetPasswordExpires).toBeDefined();
  });

  /* ===================================================
     TEST 2 → No revelar si el correo no existe
     =================================================== */
  it("Debe responder OK aunque el correo no exista (seguridad)", async () => {

    const res = await request(app)
      .post("/auth/forgot-password")
      .send({ email: "inexistente@gmail.com" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  /* ===================================================
     TEST 3 → Resetear contraseña con token válido
     =================================================== */
  it("Debe cambiar la contraseña usando un token válido", async () => {

    const oldPassword = await bcrypt.hash("123456", 10);

    const user = await Member.create({
      firstName: "Admin",
      lastName: "Gym",
      email: "admin@gmail.com",
      password: oldPassword,
      rol: "admin",
      estado: "activo"
    });

    // 1️⃣ Solicitar recuperación
    await request(app)
      .post("/auth/forgot-password")
      .send({ email: "admin@gmail.com" });

    const updatedUser = await Member.findById(user._id);
    const token = updatedUser?.resetPasswordToken;

    expect(token).toBeDefined();

    // 2️⃣ Resetear contraseña
    const res = await request(app)
      .post("/auth/reset-password")
      .send({
        token,
        password: "nuevaPassword123"
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    // 3️⃣ Validar que la contraseña cambió
    const finalUser = await Member.findById(user._id);
    const match = await bcrypt.compare(
      "nuevaPassword123",
      finalUser!.password
    );

    expect(match).toBe(true);
    expect(finalUser?.resetPasswordToken).toBeUndefined();
    expect(finalUser?.resetPasswordExpires).toBeUndefined();
  });

  /* ===================================================
     TEST 4 → Token inválido o vencido
     =================================================== */
  it("Debe fallar si el token es inválido", async () => {

    const res = await request(app)
      .post("/auth/reset-password")
      .send({
        token: "token-falso",
        password: "12345678"
      });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

});
