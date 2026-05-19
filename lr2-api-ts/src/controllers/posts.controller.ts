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
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        res.status(401).json({ error: { code: "UNAUTHORIZED", message: "User not authenticated" } });
        return;
      }
      res.status(201).json(postsService.create(req.body, currentUserId));
    } catch (error) {
      next(error);
    }
  },

  update(req: Request, res: Response, next: NextFunction): void {
    try {
      const postId = String(req.params.id);
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        res.status(401).json({ error: { code: "UNAUTHORIZED", message: "User not authenticated" } });
        return;
      }
      res.status(200).json(postsService.update(postId, req.body, currentUserId));
    } catch (error) {
      next(error);
    }
  },

  delete(req: Request, res: Response, next: NextFunction): void {
    try {
      const postId = String(req.params.id);
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        res.status(401).json({ error: { code: "UNAUTHORIZED", message: "User not authenticated" } });
        return;
      }
      postsService.delete(postId, currentUserId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  stats(_req: Request, res: Response, next: NextFunction): void {
    try {
      res.status(200).json(postsService.stats());
    } catch (error) {
      next(error);
    }
  },

  authorStats(_req: Request, res: Response, next: NextFunction): void {
    try {
      res.status(200).json(postsService.authorStats());
    } catch (error) {
      next(error);
    }
  },

  categoryPostStats(_req: Request, res: Response, next: NextFunction): void {
    try {
      res.status(200).json(postsService.categoryPostStats());
    } catch (error) {
      next(error);
    }
  }
};