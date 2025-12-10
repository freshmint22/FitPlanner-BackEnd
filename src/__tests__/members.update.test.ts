import request from "supertest";
import app from "../app";
import Member from "../models/member.model";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import { MongoMemoryServer } from 'mongodb-memory-server';

let mongo: MongoMemoryServer;
beforeAll(async () => {
  // Conexión a la DB de pruebas con servidor en memoria
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongo) await mongo.stop();
});

/**
 * Función que genera tokens igual que tu backend
 */
const genToken = (userId: string) => {
  return jwt.sign(
    { id: userId, rol: "user" },
    process.env.JWT_SECRET || "dev-secret",
    { algorithm: "HS256" }
  );
};

describe("PUT /members/:id – Editar perfil", () => {
  it("debe actualizar su propio perfil correctamente", async () => {
    // Crear usuario real en la DB
    const user = await Member.create({
      firstName: "Juan",
      lastName: "Díaz",
      email: "juan@test.com",
      phone: "12345",
      password: "123456",
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
    const user1 = await Member.create({
      firstName: "Luis",
      lastName: "Gómez",
      email: "luis@test.com",
      phone: "12345",
      password: "123456",
      rol: "user",
      estado: "activo"
    });

    const user2 = await Member.create({
      firstName: "Ana",
      lastName: "Paz",
      email: "ana@test.com",
      phone: "98765",
      password: "123456",
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
