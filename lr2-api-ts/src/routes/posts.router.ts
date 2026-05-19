import express from "express";
import { postsController } from "../controllers/posts.controller.js";
import { authOrDemo } from "../middleware/jwtAuth.js";

export const postsRouter = express.Router();

postsRouter.get('/stats', postsController.stats);
postsRouter.get('/stats/authors', postsController.authorStats);
postsRouter.get('/stats/categories-avg', postsController.categoryPostStats);
postsRouter.get('/', postsController.list);
postsRouter.get('/:id', postsController.getById);
postsRouter.post('/', authOrDemo, postsController.create);
postsRouter.put('/:id', authOrDemo, postsController.update);
postsRouter.delete('/:id', authOrDemo, postsController.delete);
