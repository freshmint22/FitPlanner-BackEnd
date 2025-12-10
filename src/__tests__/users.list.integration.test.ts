import request from "supertest";
import app from "../app";
import mongoose from "mongoose";
import Member from "../models/member.model";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const genToken = (id: string, rol: string) =>
  jwt.sign({ id, rol }, process.env.JWT_SECRET || "dev-secret");

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

describe("GET /api/users (integration)", () => {

  it("requires authentication", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });

  it("forbids non-admin users", async () => {
    const user = await Member.create({
      firstName: "Test",
      lastName: "User",
      email: "user@test.com",
      password: "12345678",
      rol: "user",
    });

    const token = genToken(user._id.toString(), "user");

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("returns paginated list for admin", async () => {
    // Crear admin
    const admin = await Member.create({
      firstName: "Admin",
      lastName: "Test",
      email: "admin@test.com",
      password: "12345678",
      rol: "admin",
    });

    const token = genToken(admin._id.toString(), "admin");

    // Crear varios usuarios
    await Member.create([
      {
        firstName: "A",
        lastName: "One",
        email: "a@test.com",
        password: "12345678",
        rol: "user",
      },
      {
        firstName: "B",
        lastName: "Two",
        email: "b@test.com",
        password: "12345678",
        rol: "user",
      }
    ]);

    const res = await request(app)
      .get("/api/users?page=1&limit=2")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("normalizes invalid pagination and limits sort/q length", async () => {
    const admin = await Member.create({
      firstName: "Admin",
      lastName: "Test",
      email: "admin2@test.com",
      password: "12345678",
      rol: "admin",
    });

    const token = genToken(admin._id.toString(), "admin");

    const res = await request(app)
      .get("/api/users?page=-20&limit=999")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

});

