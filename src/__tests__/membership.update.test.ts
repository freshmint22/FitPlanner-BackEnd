import request from "supertest";
import app from "../app";
import Member from "../models/member.model";
import Payment from "../models/payment.model";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    await mongoose.connect(uri!);
  }
});

beforeEach(async () => {
  await Member.deleteMany({});
  await Payment.deleteMany({});
});

afterAll(async () => {
  // global teardown handled by src/__tests__/jest.setup.ts
});

const genToken = (userId: string) => {
  return jwt.sign(
    { id: userId, rol: "user" },
    process.env.JWT_SECRET || "dev-secret",
    { algorithm: "HS256" }
  );
};

describe("PUT /members/:memberId/membership – Actualización de membresía", () => {
  
  it("debe actualizar la membresía y registrar un pago simulado", async () => {

    const hashed = await bcrypt.hash("123456", 10);

    const user = await Member.create({
      firstName: "Laura",
      lastName: "Test",
      email: "laura@test.com",
      password: hashed,
      rol: "user",
      estado: "activo"
    });

    const token = genToken(user._id.toString());

    const res = await request(app)
      .put(`/members/${user._id}/membership`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Plan Premium",
        price: 45000,
        duration: 30
      });

    expect(res.status).toBe(200);
    expect(res.body.data.membership.name).toBe("Plan Premium");
    expect(res.body.data.membership.price).toBe(45000);

    const payment = await Payment.findOne({ memberId: user._id });

    expect(payment).not.toBeNull();
    expect(payment?.amount).toBe(45000);
  });

  it("debe impedir actualizar la membresía si faltan datos", async () => {

    const hashed = await bcrypt.hash("123456", 10);

    const user = await Member.create({
      firstName: "Pedro",
      lastName: "Error",
      email: "pedro@test.com",
      password: hashed,
      rol: "user",
      estado: "activo"
    });

    const token = genToken(user._id.toString());

    const res = await request(app)
      .put(`/members/${user._id}/membership`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        price: 50000
      });

    expect(res.status).toBe(400);
  });

  it("debe impedir que un usuario actualice la membresía de otro", async () => {

    const hashed = await bcrypt.hash("123456", 10);

    const user1 = await Member.create({
      firstName: "Usuario1",
      lastName: "Test",
      email: "u1@test.com",
      password: hashed,
      rol: "user",
      estado: "activo"
    });

    const user2 = await Member.create({
      firstName: "Usuario2",
      lastName: "Test",
      email: "u2@test.com",
      password: hashed,
      rol: "user",
      estado: "activo"
    });

    const tokenUser1 = genToken(user1._id.toString());

    const res = await request(app)
      .put(`/members/${user2._id}/membership`)
      .set("Authorization", `Bearer ${tokenUser1}`)
      .send({
        name: "Plan Oro",
        price: 30000,
        duration: 30
      });

    expect(res.status).toBe(403);
  });

});
