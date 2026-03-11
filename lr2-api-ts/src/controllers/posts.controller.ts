import type { NextFunction, Request, Response } from "express";
import { postsService } from "../services/posts.service.js";

export const postsController = {
  list(req: Request, res: Response): void {
    res.json(postsService.list(req.query as Record<string, unknown>));
  },

  getById(req: Request, res: Response, next: NextFunction): void {
    try {
      const postId = String(req.params.id);
      res.status(200).json(postsService.getById(postId));
    } catch (error) {
      next(error);
    }
  },

  create(req: Request, res: Response, next: NextFunction): void {
    try {
      res.status(201).json(postsService.create(req.body));
    } catch (error) {
      next(error);
    }
  },

  update(req: Request, res: Response, next: NextFunction): void {
    try {
      const postId = String(req.params.id);
      res.status(200).json(postsService.update(postId, req.body));
    } catch (error) {
      next(error);
    }
  },

  delete(req: Request, res: Response, next: NextFunction): void {
    try {
      const postId = String(req.params.id);
      postsService.delete(postId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};