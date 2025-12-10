import request from "supertest";
import app from "../app";
import mongoose from "mongoose";
import Member from "../models/member.model";
import jwt from "jsonwebtoken";

const genToken = (userId: string) =>
  jwt.sign({ id: userId, rol: "admin" }, process.env.JWT_SECRET || "test-secret");

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

describe("GET /reportes/retencion", () => {

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

  it("Debe calcular correctamente el porcentaje de retención", async () => {

    // Total = 3
    await Member.create([
      { firstName: "Ana", lastName: "Lopez", email: "ana@test.com", password: "123", estado: "activo", rol: "user" },
      { firstName: "Pedro", lastName: "Gomez", email: "pe@test.com", password: "123", estado: "inactivo", rol: "user" },
      { firstName: "Maria", lastName: "Torres", email: "ma@test.com", password: "123", estado: "activo", rol: "user" }
    ]);

    const res = await request(app)
      .get("/reportes/retencion")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const { retencion, totalMiembros, activos } = res.body;

    expect(totalMiembros).toBe(4); // 3 + admin creado
    expect(activos).toBe(3);       // 2 + admin

    // Retención = 3 / 4 → 75%
    expect(retencion).toBe(75);
  });
});
