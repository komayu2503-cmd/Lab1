import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import { initDb } from "./db/initDb.js";
import { logger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { securityHeaders } from "./middleware/securityHeaders.js";
import { usersRouter } from "./routes/users.router.js";
import { postsRouter } from "./routes/posts.router.js";
import { categoriesRouter } from "./routes/categories.router.js";
import { authRouter } from "./routes/auth.router.js";
import { errNotFound } from "./errors.js";

const app = express();
const PORT = process.env.PORT || 3000;

initDb();

const ALLOWED_ORIGINS = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (e.g. curl, Postman) or from allowed list
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Demo-UserId'],
  credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(securityHeaders);
app.use(logger);

app.get('/api/v1/health', (_req, res) => res.status(200).json({ ok: true }));

app.use('/api/v1/users',      usersRouter);
app.use('/api/v1/posts',      postsRouter);
app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/auth',       authRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json(errNotFound('Route not found'));
});

app.use(errorHandler);

app.listen(PORT, () => console.log(`API started on http://localhost:${PORT}`));
