import { categoriesRepository } from "../repositories/categories.repository.js";
import { categoryToDto } from "../mappers.js";
import { errConflict, errNotFound, errValidation } from "../errors.js";
import { validateCreateCategoryDto, validateUpdateCategoryDto } from "../dtos/category.schemas.js";
import type { CategoryDto, ListResponse } from "../types.js";

export const categoriesService = {
  list(): ListResponse<CategoryDto> {
    const items = categoriesRepository.getAll().map(categoryToDto);
    return { items, total: items.length };
  },

  getById(id: number): CategoryDto {
    const category = categoriesRepository.getById(id);

    if (!category) {
      throw errNotFound('Category not found');
    }

    return categoryToDto(category);
  },

  create(input: unknown): CategoryDto {
    const validation = validateCreateCategoryDto(input);

    if (validation.details.length > 0 || !validation.value) {
      throw errValidation(validation.details);
    }

    if (categoriesRepository.nameExists(validation.value.name)) {
      throw errConflict('Category already exists', [{ field: 'name', message: 'name already exists' }]);
    }

    return categoryToDto(categoriesRepository.create(validation.value));
  },

  update(id: number, input: unknown): CategoryDto {
    if (!categoriesRepository.getById(id)) {
      throw errNotFound('Category not found');
    }

    const validation = validateUpdateCategoryDto(input);

    if (validation.details.length > 0 || !validation.value) {
      throw errValidation(validation.details);
    }

    if (validation.value.name && categoriesRepository.nameExists(validation.value.name, id)) {
      throw errConflict('Category already exists', [{ field: 'name', message: 'name already exists' }]);
    }

    const updated = categoriesRepository.update(id, validation.value);

    if (!updated) {
      throw errNotFound('Category not found');
    }

    return categoryToDto(updated);
  },

  delete(id: number): void {
    if (!categoriesRepository.delete(id)) {
      throw errNotFound('Category not found');
    }
  }
};