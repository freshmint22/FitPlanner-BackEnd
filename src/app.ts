import express from 'express';
import cors from 'cors';
import membersRouter from './routes/members.routes';
import routinesRouter from './routes/routines.routes';
import usersRouter from './routes/users.routes';
import authRouter from './routes/auth.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/miembros', membersRouter);
app.use('/routines', routinesRouter);
app.use('/users', usersRouter);
// expose users also under /api/users for frontend consistency
app.use('/api/users', usersRouter);
app.use('/auth', authRouter);

app.use(errorHandler);

export default app;
