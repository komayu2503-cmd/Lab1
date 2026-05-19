import type { Detail, LoginDto, RegisterDto } from "../types.js";

function isEmail(value: string): boolean {
  return /^\S+@\S+\.\S+$/.test(value);
}

export function validateRegisterDto(input: unknown): { details: Detail[]; value?: RegisterDto } {
  const details: Detail[] = [];
  const body = input as Record<string, unknown>;

  const name = body.name;
  const email = body.email;
  const password = body.password;

  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 60) {
    details.push({ field: "name", message: "name is required and must be 2-60 characters" });
  }

  if (typeof email !== "string" || !isEmail(email.trim())) {
    details.push({ field: "email", message: "email must be a valid email address" });
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    details.push({ field: "password", message: "password must be 8-128 characters" });
  }

  if (details.length > 0) {
    return { details };
  }

  const validName = name as string;
  const validEmail = email as string;
  const validPassword = password as string;

  return {
    details,
    value: {
      name: validName.trim(),
      email: validEmail.trim().toLowerCase(),
      password: validPassword,
    },
  };
}

export function validateLoginDto(input: unknown): { details: Detail[]; value?: LoginDto } {
  const details: Detail[] = [];
  const body = input as Record<string, unknown>;

  const email = body.email;
  const password = body.password;

  if (typeof email !== "string" || !isEmail(email.trim())) {
    details.push({ field: "email", message: "email must be a valid email address" });
  }

  if (typeof password !== "string" || password.length < 1) {
    details.push({ field: "password", message: "password is required" });
  }

  if (details.length > 0) {
    return { details };
  }

  const validEmail = email as string;
  const validPassword = password as string;

  return {
    details,
    value: {
      email: validEmail.trim().toLowerCase(),
      password: validPassword,
    },
  };
}
