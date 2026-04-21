import express from "express";
import { postsController } from "../controllers/posts.controller.js";

export const postsRouter = express.Router();

postsRouter.get('/stats', postsController.stats);
postsRouter.get('/stats/authors', postsController.authorStats);
postsRouter.get('/stats/categories-avg', postsController.categoryPostStats);
postsRouter.get('/', postsController.list);
postsRouter.get('/:id', postsController.getById);
postsRouter.post('/', postsController.create);
postsRouter.put('/:id', postsController.update);
postsRouter.delete('/:id', postsController.delete);
