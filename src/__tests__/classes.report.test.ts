import request from "supertest";
import app from "../app";
import mongoose from "mongoose";

import ClassModel from "../models/class.model";
import Attendance from "../models/attendance.model";

// AUTENTICACIÓN — si tu ruta requiere token, ajusta esto
const fakeToken = "Bearer testingtoken123";

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    await mongoose.connect(uri!);
  }
});

beforeEach(async () => {
  await ClassModel.deleteMany({});
  await Attendance.deleteMany({});
});

afterAll(async () => {
  // global teardown handled by src/__tests__/jest.setup.ts
});

describe("GET /reportes/clases – Reporte de clases impartidas", () => {

  it("Debe retornar el reporte de clases con ocupación y asistentes", async () => {

    // Crear clase1
    const clase1 = await ClassModel.create({
      name: "Functional",
      instructorName: "Laura Gómez",
      date: new Date(),
      capacity: 20
    });

    // Crear clase2 sin asistentes
    await ClassModel.create({
      name: "Cardio",
      instructorName: "Carlos Ruiz",
      date: new Date(),
      capacity: 15
    });

    // Crear asistencias válidas (USAR ObjectId reales y date requerido)
    await Attendance.create([
      { memberId: new mongoose.Types.ObjectId(), classId: clase1._id, date: new Date() },
      { memberId: new mongoose.Types.ObjectId(), classId: clase1._id, date: new Date() },
      { memberId: new mongoose.Types.ObjectId(), classId: clase1._id, date: new Date() }
    ]);

    const res = await request(app)
      .get("/reportes/clases")
      .set("Authorization", fakeToken);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const reporte = res.body.reporte;

    const functional = reporte.find((c: any) => c.nombre === "Functional");
    const cardio = reporte.find((c: any) => c.nombre === "Cardio");

    expect(functional.asistentes).toBe(3);
    expect(functional.ocupacion).toBe(Math.round((3 / 20) * 100));

    expect(cardio.asistentes).toBe(0);
    expect(cardio.ocupacion).toBe(0);
  });

  it("Debe filtrar por nombre del entrenador usando ?entrenador=", async () => {

    await ClassModel.create([
      { name: "Yoga", instructorName: "Paula Diaz", date: new Date(), capacity: 10 },
      { name: "Spinning", instructorName: "Carlos Lopez", date: new Date(), capacity: 18 }
    ]);

    const res = await request(app)
      .get("/reportes/clases?entrenador=paula")
      .set("Authorization", fakeToken);

    expect(res.status).toBe(200);
    expect(res.body.reporte.length).toBe(1);
    expect(res.body.reporte[0].entrenador).toBe("Paula Diaz");
  });

});
