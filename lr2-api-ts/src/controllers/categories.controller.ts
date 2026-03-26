import type { Request, Response } from "express";
import { categoriesService } from "../services/categories.service.js";

export const categoriesController = {
  list(_req: Request, res: Response): void {
    res.json(categoriesService.list());
  }
};