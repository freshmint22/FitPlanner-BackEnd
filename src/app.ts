import express from 'express';
import cors from 'cors';

import membersRouter from './routes/members.routes';
import routinesRouter from './routes/routines.routes';
import usersRouter from './routes/users.routes';
import authRouter from './routes/auth.routes';
import attendanceRoutes from './routes/attendances.routes'; 
import reportsRoutes from "./routes/reports.routes";      
import paymentsRoutes from "./routes/payments.routes";     
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

/* ---------------------------
   RUTAS PARA LOS TESTS
---------------------------- */

// HU-19 → Jest usa /members/:id
app.use('/members', membersRouter);

/* ---------------------------
   RUTAS OFICIALES DE LA API
---------------------------- */

app.use('/api/miembros', membersRouter);
app.use('/routines', routinesRouter);
app.use('/users', usersRouter);

// Soporte legacy para frontend
app.use('/api/users', usersRouter);

app.use('/auth', authRouter);

// ⬅️ NUEVA RUTA OFICIAL PARA ASISTENCIAS
app.use('/api/attendances', attendanceRoutes);

// ⬅️ NUEVA RUTA OFICIAL PARA REPORTES
app.use("/reportes", reportsRoutes);

// ⬅️ NUEVA RUTA OFICIAL PARA PAGOS
app.use("/pagos", paymentsRoutes);

/* ---------------------------
   MIDDLEWARE DE ERRORES
---------------------------- */

app.use(errorHandler);

export default app;
