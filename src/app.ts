import express from "express";
import cors from "cors";

import membersRouter from "./routes/members.routes";
import routinesRouter from "./routes/routines.routes";
import usersRouter from "./routes/users.routes";
import authRouter from "./routes/auth.routes";
import attendanceRoutes from "./routes/attendances.routes";
import reportsRoutes from "./routes/reports.routes";
import paymentsRoutes from "./routes/payments.routes";
import notificationsRoutes from "./routes/notifications.routes";
import gymInfoRoutes from "./routes/gymInfo.routes";
import plansRoutes from "./routes/plans.routes";
import { errorHandler } from "./middleware/errorHandler";
import generalConfigRoutes from "./routes/generalConfig.routes";

const app = express();

app.use(cors());
app.use(express.json());

// -------------------
// MEMBERS
// -------------------
app.use("/members", membersRouter);
app.use("/api/miembros", membersRouter);
app.use("/api/members", membersRouter);

// -------------------
// USERS
// -------------------
app.use("/users", usersRouter);
app.use("/api/users", usersRouter);

// -------------------
// AUTH
// -------------------
app.use("/auth", authRouter);
app.use("/api/auth", authRouter);

// -------------------
// ROUTINES
// -------------------
app.use("/routines", routinesRouter);
app.use("/api/routines", routinesRouter);

// -------------------
// ATTENDANCE
// -------------------
app.use("/api/attendances", attendanceRoutes);

// -------------------
// REPORTS & PAYMENTS
// -------------------
app.use("/reportes", reportsRoutes);
app.use("/pagos", paymentsRoutes);

// -------------------
// NOTIFICATIONS ✅ CLAVE
// -------------------
app.use("/notifications", notificationsRoutes);
app.use("/api/notifications", notificationsRoutes);

// -------------------
// GYM INFO
// -------------------
app.use("/", gymInfoRoutes);

// -------------------
// PLANS
// -------------------
app.use("/planes", plansRoutes);
app.use("/api/planes", plansRoutes);

// -------------------
// GENERAL CONFIG
// -------------------
app.use("/configuracion/general", generalConfigRoutes);
app.use("/api/configuracion/general", generalConfigRoutes);

app.use(errorHandler);

export default app;
