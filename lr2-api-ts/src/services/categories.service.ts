import { categoriesRepository } from "../repositories/categories.repository.js";
import type { ListResponse } from "../types.js";

export const categoriesService = {
  list(): ListResponse<string> {
    const items = categoriesRepository.getAll();
    return { items, total: items.length };
  }
};