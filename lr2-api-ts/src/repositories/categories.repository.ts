import { store } from "../store.js";

export const categoriesRepository = {
  getAll(): string[] {
    return store.categories;
  },

  exists(category: string): boolean {
    return store.categories.includes(category);
  }
};