import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import usersRoute from './routes/users';
import projectsRoute from './routes/projects';
import tasksRoute from './routes/tasks';
import transactionsRoute from './routes/transactions';
import authRouter from './routes/auth';
import auditRouter from './routes/audit';
import { errorHandler } from './middleware/errorHandler';
import { prisma } from './lib/prisma';

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()) ?? [
  'http://localhost:3000',
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);
// Increase body size limit to 10MB for CSV imports
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('dev'));

app.use('/api/users', usersRoute);
app.use('/api/projects', projectsRoute);
app.use('/api/tasks', tasksRoute);
app.use('/api/auth', authRouter);
app.use('/api/audit', auditRouter);
app.use('/api/transactions', transactionsRoute);

app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
