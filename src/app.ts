import express from "express";
import cors from "cors";

import membersRouter from "./routes/members.routes";
import routinesRouter from "./routes/routines.routes";
import usersRouter from "./routes/users.routes";
import authRouter from "./routes/auth.routes";
import classesRouter from "./routes/classes.routes";
import routinesRouter2 from "./routes/routines.routes";
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



app.use("/members", membersRouter);
app.use("/api/miembros", membersRouter);

app.use("/routines", routinesRouter);
app.use("/users", usersRouter);
app.use("/api/users", usersRouter);
app.use('/classes', classesRouter);
app.use('/routines', routinesRouter2);

app.use("/auth", authRouter);

app.use("/api/attendances", attendanceRoutes);

app.use("/reportes", reportsRoutes);
app.use("/pagos", paymentsRoutes);

app.use("/notifications", notificationsRoutes);
// Mount notifications routes at root so legacy paths like
// `/configuracion/notificaciones` used in tests resolve correctly.
app.use("/", notificationsRoutes);
app.use("/", gymInfoRoutes);

app.use("/planes", plansRoutes);

app.use("/configuracion/general", generalConfigRoutes);

app.use(errorHandler);

export default app;
