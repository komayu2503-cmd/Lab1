import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { demoAuth } from "./demoAuth.js";

type JwtPayload = {
  id: number;
  role?: string;
};

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

export function jwtAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.header("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Missing or invalid Authorization header", details: [] },
    });
    return;
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = { id: Number(payload.id), role: payload.role ?? "user" };
    next();
  } catch {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Invalid or expired token", details: [] },
    });
  }
}

export function authOrDemo(req: Request, res: Response, next: NextFunction): void {
  if ((req.header("Authorization") ?? "").startsWith("Bearer ")) {
    jwtAuth(req, res, next);
    return;
  }

  demoAuth(req, res, next);
}
