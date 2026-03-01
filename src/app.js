import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import evaluatorRoutes from './routes/evaluator.routes.js';
import meRoutes from './routes/me.routes.js';
import reportRoutes from './routes/reports.routes.js';
import systemRoutes from './routes/system.routes.js';

import errorMiddleware from './middlewares/error.middleware.js';

const app = express();

// Security & basic middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/evaluator', evaluatorRoutes);
app.use('/me', meRoutes);
app.use('/reports', reportRoutes);
app.use('/system', systemRoutes);

// Global error handler
app.use(errorMiddleware);

export default app;
