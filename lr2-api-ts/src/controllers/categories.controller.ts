import type { NextFunction, Request, Response } from "express";
import { categoriesService } from "../services/categories.service.js";

export const categoriesController = {
  list(_req: Request, res: Response): void {
    res.json(categoriesService.list());
  },

  getById(req: Request, res: Response, next: NextFunction): void {
    try {
      res.status(200).json(categoriesService.getById(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  },

  create(req: Request, res: Response, next: NextFunction): void {
    try {
      res.status(201).json(categoriesService.create(req.body));
    } catch (error) {
      next(error);
    }
  },

  update(req: Request, res: Response, next: NextFunction): void {
    try {
      res.status(200).json(categoriesService.update(Number(req.params.id), req.body));
    } catch (error) {
      next(error);
    }
  },

  delete(req: Request, res: Response, next: NextFunction): void {
    try {
      categoriesService.delete(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};