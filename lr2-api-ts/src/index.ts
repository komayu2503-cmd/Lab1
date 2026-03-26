import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import { logger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { usersRouter } from "./routes/users.router.js";
import { postsRouter } from "./routes/posts.router.js";
import { categoriesRouter } from "./routes/categories.router.js";
import { errNotFound } from "./errors.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(logger);

app.get('/api/health', (_req, res) => res.status(200).json({ ok: true }));

app.use('/api/users',      usersRouter);
app.use('/api/posts',      postsRouter);
app.use('/api/categories', categoriesRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json(errNotFound('Route not found'));
});

app.use(errorHandler);

app.listen(PORT, () => console.log(`API started on http://localhost:${PORT}`));