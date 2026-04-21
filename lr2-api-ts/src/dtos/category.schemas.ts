import type { CreateCategoryDto, Detail, UpdateCategoryDto } from "../types.js";

export function validateCreateCategoryDto(input: unknown): { details: Detail[]; value?: CreateCategoryDto } {
  const details: Detail[] = [];
  const body = input as Record<string, unknown>;
  const name = body.name;

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
    details.push({ field: 'name', message: 'name is required and must be 2-50 characters' });
  }

  if (details.length > 0) {
    return { details };
  }

  const validName = name as string;

  return {
    details,
    value: { name: validName.trim() }
  };
}

export function validateUpdateCategoryDto(input: unknown): { details: Detail[]; value?: UpdateCategoryDto } {
  const details: Detail[] = [];
  const body = input as Record<string, unknown>;
  const nextValue: UpdateCategoryDto = {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 50) {
      details.push({ field: 'name', message: 'name must be 2-50 characters' });
    } else {
      nextValue.name = body.name.trim();
    }
  }

  if (details.length > 0) {
    return { details };
  }

  return { details, value: nextValue };
}