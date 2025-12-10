import request from "supertest";
import app from "../app";
import mongoose from "mongoose";

import Member from "../models/member.model";

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

describe("GET /reportes/nuevos-miembros-mes", () => {

  it("Debe retornar la cantidad de nuevos miembros agrupados por mes", async () => {

    const year = new Date().getFullYear();

    // Crear miembros en enero y marzo del año actual
    await Member.create([
      {
        firstName: "EneroUser",
        lastName: "Test",
        email: "enero@test.com",
        password: "123",
        estado: "activo",
        createdAt: new Date(year, 0, 15) // Enero
      },
      {
        firstName: "MarzoUser",
        lastName: "Test",
        email: "marzo@test.com",
        password: "123",
        estado: "activo",
        createdAt: new Date(year, 2, 10) // Marzo
      }
    ]);

    const res = await request(app)
      .get("/reportes/nuevos-miembros-mes")
      .set("Authorization", "Bearer testtoken123");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const data = res.body.data;

    // Enero = mes 1
    const enero = data.find((m: any) => m.mes === 1);
    // Marzo = mes 3
    const marzo = data.find((m: any) => m.mes === 3);

    expect(enero.total).toBe(1);
    expect(marzo.total).toBe(1);
  });

});
