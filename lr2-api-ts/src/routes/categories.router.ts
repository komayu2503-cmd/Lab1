import express from "express";
import { categoriesController } from "../controllers/categories.controller.js";

export const categoriesRouter = express.Router();

categoriesRouter.get('/', categoriesController.list);
categoriesRouter.get('/:id', categoriesController.getById);
categoriesRouter.post('/', categoriesController.create);
categoriesRouter.put('/:id', categoriesController.update);
categoriesRouter.delete('/:id', categoriesController.delete);
