import express from "express";
import cors from "cors";

import membersRouter from "./routes/members.routes";
import routinesRouter from "./routes/routines.routes";
import usersRouter from "./routes/users.routes";
import authRouter from "./routes/auth.routes";
import classesRouter from "./routes/classes.routes";
import routinesRouter2 from "./routes/routines.routes";
import attendanceRoutes from "./routes/attendances.routes";
import apiPrefixRewrite from './middleware/apiPrefixRewrite';
import reportsRoutes from "./routes/reports.routes";
import paymentsRoutes from "./routes/payments.routes";
import notificationsRoutes from "./routes/notifications.routes";
import gymInfoRoutes from "./routes/gymInfo.routes";
import plansRoutes from "./routes/plans.routes";
import aiRoutes from './routes/ai.routes';
import { errorHandler } from "./middleware/errorHandler";
import generalConfigRoutes from "./routes/generalConfig.routes";


const app = express();

// Configure CORS to allow credentials and a restricted origin list.
// BACKEND_CORS_ORIGIN can be a single URL or comma-separated URLs.
// Include the deployed frontend origin by default so Vercel deployments
// can call the backend without requiring an immediate env change in Render.
// This is a temporary safety measure; prefer updating `BACKEND_CORS_ORIGIN`
// in Render's environment variables to list allowed origins explicitly.
const allowedOrigins = (process.env.BACKEND_CORS_ORIGIN || 'http://localhost:5173,https://fit-planner-front-end-git-main-freshmint22s-projects.vercel.app')
	.split(',')
	.map((o) => o.trim())
	.filter(Boolean);

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true); // allow non-browser clients
			return allowedOrigins.includes(origin)
				? callback(null, true)
				: callback(new Error('Not allowed by CORS'));
		},
		credentials: true,
	})
);
app.use(express.json());

// Rewrite legacy requests that call API routes without the `/api` prefix.
app.use(apiPrefixRewrite);


app.use("/members", membersRouter);
app.use("/api/miembros", membersRouter);

app.use("/routines", routinesRouter);
app.use("/users", usersRouter);
app.use("/api/users", usersRouter);
app.use('/classes', classesRouter);
app.use('/routines', routinesRouter2);

app.use("/auth", authRouter);
// Also mount under /api/auth so requests to /auth (rewritten or direct)
// and /api/auth are both handled. This ensures legacy frontend calls
// and the newer `/api`-prefixed calls work in production.
app.use("/api/auth", authRouter);

app.use("/api/attendances", attendanceRoutes);
// Legacy frontend may call /attendances without the /api prefix — support both
app.use("/attendances", attendanceRoutes);

app.use("/reportes", reportsRoutes);
app.use("/pagos", paymentsRoutes);

app.use("/notifications", notificationsRoutes);
// Mount notifications routes at root so legacy paths like
// `/configuracion/notificaciones` used in tests resolve correctly.
app.use("/", notificationsRoutes);
app.use("/", gymInfoRoutes);

app.use("/planes", plansRoutes);

// AI routines endpoint (server-side uses OPENAI_API_KEY)
app.use('/api/ai', aiRoutes);

app.use("/configuracion/general", generalConfigRoutes);

app.use(errorHandler);

export default app;
