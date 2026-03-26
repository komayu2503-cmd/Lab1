import type { NextFunction, Request, Response } from "express";
import { usersService } from "../services/users.service.js";

export const usersController = {
  list(_req: Request, res: Response): void {
    res.json(usersService.list());
  },

  getById(req: Request, res: Response, next: NextFunction): void {
    try {
      res.status(200).json(usersService.getById(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  },

  create(req: Request, res: Response, next: NextFunction): void {
    try {
      res.status(201).json(usersService.create(req.body));
    } catch (error) {
      next(error);
    }
  },

  update(req: Request, res: Response, next: NextFunction): void {
    try {
      res.status(200).json(usersService.update(Number(req.params.id), req.body));
    } catch (error) {
      next(error);
    }
  },

  delete(req: Request, res: Response, next: NextFunction): void {
    try {
      usersService.delete(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};