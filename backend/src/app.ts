import cookieParser from 'cookie-parser';
import cors from 'cors';
import csrf from 'csurf';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import xss from 'xss';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import adminRoutes from './modules/admin/admin.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import clientRoutes from './modules/client/client.routes.js';
import publicRoutes from './modules/public/public.routes.js';
import { openApiSpec } from './openapi.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(pinoHttp());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 250 }));
app.use((req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') req.body[key] = xss(value.trim());
    }
  }
  next();
});

if (env.NODE_ENV === 'production') {
  app.use(csrf({ cookie: { httpOnly: true, sameSite: 'strict', secure: true } }));
}

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.use('/public', publicRoutes);
app.use('/auth', authRoutes);
app.use('/client', clientRoutes);
app.use('/admin', adminRoutes);
app.use('/uploads', express.static('uploads'));
app.use(errorHandler);
