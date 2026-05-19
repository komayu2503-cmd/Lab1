import type { NextFunction, Request, Response } from "express";
import { authService } from "../services/auth.service.js";

export const authController = {
  register(req: Request, res: Response, next: NextFunction): void {
    try {
      res.status(201).json(authService.register(req.body));
    } catch (error) {
      next(error);
    }
  },

  login(req: Request, res: Response, next: NextFunction): void {
    try {
      res.status(200).json(authService.login(req.body));
    } catch (error) {
      next(error);
    }
  },
};
