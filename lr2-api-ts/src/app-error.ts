import type { ApiErrorCode, Detail, ErrorResponse } from "./types.js";

export class AppError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details: Detail[];

  constructor(status: number, code: ApiErrorCode, message: string, details: Detail[] = []) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  toResponse(): ErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details
      }
    };
  }
}