import type { Request, Response, NextFunction } from "express";
import { AppError } from "../app-error.js";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.status).json(err.toResponse());
    return;
  }

  console.error(err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error', details: [] }
  });
}
