import type { Request, Response, NextFunction } from "express";

export function logger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const route = req.originalUrl || req.url;
    console.log(`${req.method} ${route} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
}
