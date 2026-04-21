import type { Request, Response, NextFunction } from "express";
import { AppError } from "../app-error.js";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.status).json(err.toResponse());
    return;
  }

  const sqliteError = err as Error & { code?: string };
  const message = sqliteError.message ?? '';

  if (sqliteError.code?.startsWith('SQLITE_CONSTRAINT') || message.includes('constraint failed')) {
    if (message.includes('UNIQUE constraint failed') || message.includes('FOREIGN KEY constraint failed')) {
      res.status(409).json({
        error: { code: 'CONFLICT', message: 'Database constraint violation', details: [] }
      });
      return;
    }

    if (message.includes('NOT NULL constraint failed') || message.includes('CHECK constraint failed')) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: [] }
      });
      return;
    }
  }

  console.error(err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error', details: [] }
  });
}
