import express from "express";
import rateLimit from "express-rate-limit";
import { authController } from "../controllers/auth.controller.js";

export const authRouter = express.Router();

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "TOO_MANY_REQUESTS", message: "Too many register attempts, try later", details: [] } },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "TOO_MANY_REQUESTS", message: "Too many login attempts, try later", details: [] } },
});

authRouter.post("/register", registerLimiter, authController.register);
authRouter.post("/login", loginLimiter, authController.login);
