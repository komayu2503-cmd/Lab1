import express from "express";
import { postsController } from "../controllers/posts.controller.js";

export const postsRouter = express.Router();

postsRouter.get('/', postsController.list);
postsRouter.get('/:id', postsController.getById);
postsRouter.post('/', postsController.create);
postsRouter.put('/:id', postsController.update);
postsRouter.delete('/:id', postsController.delete);
