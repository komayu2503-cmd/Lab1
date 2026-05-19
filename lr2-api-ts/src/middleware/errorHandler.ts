import type { Request, Response, NextFunction } from "express";
import { AppError } from "../app-error.js";

/**
 * Global error handler middleware.
 * 
 * SECURITY FIX: Don't expose stack traces or internal details in responses.
 * Only show stack traces in development mode (logged to console).
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  const isDev = process.env.NODE_ENV === 'development';

  if (err instanceof AppError) {
    res.status(err.status).json(err.toResponse());
    return;
  }

  const sqliteError = err as Error & { code?: string };
  const message = sqliteError.message ?? '';

  if (sqliteError.code?.startsWith('SQLITE_CONSTRAINT') || message.includes('constraint failed')) {
    if (message.includes('UNIQUE constraint failed') || message.includes('FOREIGN KEY constraint failed')) {
      // Log the error for debugging
      if (isDev) {
        console.error('[CONSTRAINT]', err);
      }
      res.status(409).json({
        error: { code: 'CONFLICT', message: 'Database constraint violation', details: [] }
      });
      return;
    }

    if (message.includes('NOT NULL constraint failed') || message.includes('CHECK constraint failed')) {
      // Log the error for debugging
      if (isDev) {
        console.error('[CONSTRAINT]', err);
      }
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: [] }
      });
      return;
    }
  }

  // Log error for debugging (visible to server admin)
  console.error('[INTERNAL_ERROR]', err);

  // Send generic error response to client (no stack trace)
  res.status(500).json({
    error: { 
      code: 'INTERNAL_ERROR', 
      message: 'Internal server error',
      ...(isDev && { details: String(err.message ?? err) }) // Only in dev
    }
  });
}
