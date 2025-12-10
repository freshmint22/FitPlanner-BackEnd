import request from "supertest";
import app from "../app";
import Member from "../models/member.model";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  await mongoose.connect(uri!);
});

// ⭐ LIMPIA LOS USUARIOS ENTRE TESTS
beforeEach(async () => {
  await Member.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

const genToken = (userId: string) => {
  return jwt.sign(
    { id: userId, rol: "user" },
    process.env.JWT_SECRET || "dev-secret",
    { algorithm: "HS256" }
  );
};

describe("PATCH /api/users/password – Cambiar contraseña", () => {

  it("Debe cambiar la contraseña exitosamente", async () => {
    const hashed = await bcrypt.hash("Password123", 10);

    const user = await Member.create({
      firstName: "Juan",
      lastName: "Díaz",
      email: "juan@test.com",
      password: hashed,
      rol: "user",
      estado: "activo"
    });

    const token = genToken(user._id.toString());

    const res = await request(app)
      .patch("/api/users/password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "Password123",
        newPassword: "NuevaClave123"
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Contraseña actualizada exitosamente");
  });

  it("Debe fallar si la contraseña actual es incorrecta", async () => {
    const hashed = await bcrypt.hash("Password123", 10);

    const user = await Member.create({
      firstName: "Ana",
      lastName: "Paz",
      email: "ana@test.com",
      password: hashed,
      rol: "user",
      estado: "activo"
    });

    const token = genToken(user._id.toString());

    const res = await request(app)
      .patch("/api/users/password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "Incorrecta",
        newPassword: "NuevaClave123"
      });

    expect(res.status).toBe(401);
  });

  it("Debe fallar si la nueva contraseña no cumple la longitud mínima", async () => {
    const hashed = await bcrypt.hash("Password123", 10);

    const user = await Member.create({
      firstName: "Luis",
      lastName: "Gómez",
      email: "luis@test.com",
      password: hashed,
      rol: "user",
      estado: "activo"
    });

    const token = genToken(user._id.toString());

    const res = await request(app)
      .patch("/api/users/password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "Password123",
        newPassword: "123"
      });

    expect(res.status).toBe(400);
  });
});
