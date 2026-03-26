import { AppError } from "./app-error.js";
import type { Detail } from "./types.js";

export function errValidation(details: Detail[]): AppError {
  return new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', details);
}

export function errNotFound(message: string): AppError {
  return new AppError(404, 'NOT_FOUND', message, [] as Detail[]);
}
