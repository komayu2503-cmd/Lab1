import type { Request, Response, NextFunction } from "express";

/**
 * Middleware для додавання базових безпечних HTTP-заголовків.
 * 
 * Загалозми:
 * - X-Content-Type-Options: nosniff - запобігає "піднюхуванню" типів контенту
 * - X-Frame-Options: DENY - запобігає clickjacking (вбудовування в iframe)
 * - Referrer-Policy: no-referrer - контроль над Referer заголовком
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
}
