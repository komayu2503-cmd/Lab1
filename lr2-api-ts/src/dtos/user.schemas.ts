import type { CreateUserDto, Detail, UpdateUserDto } from "../types.js";
import { isValidEmail } from "../utils/validators.js";

export function validateCreateUserDto(input: unknown): { details: Detail[]; value?: CreateUserDto } {
  const details: Detail[] = [];
  const body = input as Record<string, unknown>;
  const name = body.name;
  const email = body.email;

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
    details.push({ field: 'name', message: 'name is required and must be 2-50 characters' });
  }

  if (typeof email !== 'string' || !isValidEmail(email)) {
    details.push({ field: 'email', message: 'email is required and must be a valid email address' });
  }

  if (details.length > 0) {
    return { details };
  }

  const validName = name as string;
  const validEmail = email as string;

  return {
    details,
    value: {
      name: validName.trim(),
      email: validEmail.trim()
    }
  };
}

export function validateUpdateUserDto(input: unknown): { details: Detail[]; value?: UpdateUserDto } {
  const details: Detail[] = [];
  const body = input as Record<string, unknown>;
  const nextValue: UpdateUserDto = {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 50) {
      details.push({ field: 'name', message: 'name must be 2-50 characters' });
    } else {
      nextValue.name = body.name.trim();
    }
  }

  if (body.email !== undefined) {
    if (typeof body.email !== 'string' || !isValidEmail(body.email)) {
      details.push({ field: 'email', message: 'email must be a valid email address' });
    } else {
      nextValue.email = body.email.trim();
    }
  }

  if (details.length > 0) {
    return { details };
  }

  return { details, value: nextValue };
}