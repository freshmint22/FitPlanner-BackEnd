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

describe("AUTH – Email con (.gym) para rol admin", () => {

  /* ===================================================
     TEST 1 → Registro ADMIN con (.gym)
     =================================================== */
  it("Debe registrar un ADMIN detectando (.gym) y normalizar el correo", async () => {

    const res = await request(app)
      .post("/auth/register")
      .send({
        firstName: "Andres",
        lastName: "Admin",
        email: "andres(.gym)@gmail.com",
        password: "123456"
      });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.token).toBeDefined();

    const admin = await Member.findOne({ email: "andres@gmail.com" });

    expect(admin).not.toBeNull();
    expect(admin?.rol).toBe("admin");
  });

  /* ===================================================
     TEST 2 → Registro USER normal
     =================================================== */
  it("Debe registrar un USER normal sin (.gym)", async () => {

    const res = await request(app)
      .post("/auth/register")
      .send({
        firstName: "Laura",
        lastName: "User",
        email: "laura@gmail.com",
        password: "123456"
      });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);

    const user = await Member.findOne({ email: "laura@gmail.com" });

    expect(user).not.toBeNull();
    expect(user?.rol).toBe("user");
  });

  /* ===================================================
     TEST 3 → Login ADMIN con correo REAL
     =================================================== */
  it("Debe permitir login del admin usando el correo real (sin .gym)", async () => {

    await request(app)
      .post("/auth/register")
      .send({
        firstName: "Admin",
        lastName: "Gym",
        email: "admin(.gym)@gmail.com",
        password: "123456"
      });

    const login = await request(app)
      .post("/auth/login")
      .send({
        email: "admin@gmail.com",
        password: "123456"
      });

    expect(login.status).toBe(200);
    expect(login.body.ok).toBe(true);
    expect(login.body.token).toBeDefined();
  });

});
