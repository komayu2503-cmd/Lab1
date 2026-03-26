import express from "express";
import { categoriesController } from "../controllers/categories.controller.js";

export const categoriesRouter = express.Router();

categoriesRouter.get('/', categoriesController.list);
