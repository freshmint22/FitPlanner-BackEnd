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

describe("PUT /members/:id – Editar perfil", () => {

  it("debe actualizar su propio perfil correctamente", async () => {

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
      .put(`/members/${user._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        firstName: "NuevoNombre",
        lastName: "Actualizado"
      });

    expect(res.status).toBe(200);
    expect(res.body.data.firstName).toBe("NuevoNombre");
    expect(res.body.data.lastName).toBe("Actualizado");
  });

  it("debe impedir actualizar el perfil de otro usuario", async () => {

    const hashed = await bcrypt.hash("Password123", 10);

    const user1 = await Member.create({
      firstName: "Luis",
      lastName: "Gómez",
      email: "luis@test.com",
      password: hashed,
      rol: "user",
      estado: "activo"
    });

    const user2 = await Member.create({
      firstName: "Ana",
      lastName: "Paz",
      email: "ana@test.com",
      password: hashed,
      rol: "user",
      estado: "activo"
    });

    const tokenUser1 = genToken(user1._id.toString());

    const res = await request(app)
      .put(`/members/${user2._id}`)
      .set("Authorization", `Bearer ${tokenUser1}`)
      .send({ firstName: "Hack" });

    expect(res.status).toBe(403);
  });
});
