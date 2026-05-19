import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { errConflict, errUnauthorized, errValidation } from "../errors.js";
import { get, run } from "../db/client.js";
import { userToDto } from "../mappers.js";
import { validateLoginDto, validateRegisterDto } from "../dtos/auth.schemas.js";
import type { AuthResponseDto, User } from "../types.js";

type AuthUserRow = {
  id: number;
  name: string;
  email: string;
  passwordHash: string | null;
  role: "user" | "admin";
};

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

function signToken(user: { id: number; role: string }): string {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
}

function getUserByEmail(email: string): AuthUserRow | undefined {
  return get<AuthUserRow>(
    `
      SELECT id, name, email, passwordHash, role
      FROM users
      WHERE lower(email) = lower(?)
      LIMIT 1;
    `,
    [email]
  );
}

function buildAuthResponse(user: User, role: string): AuthResponseDto {
  return {
    token: signToken({ id: user.id, role }),
    user: userToDto(user),
  };
}

export const authService = {
  register(input: unknown): AuthResponseDto {
    const validation = validateRegisterDto(input);
    if (validation.details.length > 0 || !validation.value) {
      throw errValidation(validation.details);
    }

    const existing = getUserByEmail(validation.value.email);
    if (existing) {
      throw errConflict("Email already exists", [{ field: "email", message: "email already exists" }]);
    }

    const now = new Date().toISOString();
    const passwordHash = bcrypt.hashSync(validation.value.password, 10);

    const result = run(
      `
        INSERT INTO users (name, email, passwordHash, role, createdAt)
        VALUES (?, ?, ?, ?, ?);
      `,
      [validation.value.name, validation.value.email, passwordHash, "user", now]
    );

    const created = get<AuthUserRow>(
      `
        SELECT id, name, email, passwordHash, role
        FROM users
        WHERE id = ?
        LIMIT 1;
      `,
      [result.lastInsertRowid]
    );

    if (!created) {
      throw errUnauthorized("Registration failed");
    }

    return buildAuthResponse(
      { id: created.id, name: created.name, email: created.email },
      created.role
    );
  },

  login(input: unknown): AuthResponseDto {
    const validation = validateLoginDto(input);
    if (validation.details.length > 0 || !validation.value) {
      throw errValidation(validation.details);
    }

    const user = getUserByEmail(validation.value.email);

    if (!user || !user.passwordHash) {
      throw errUnauthorized("Invalid email or password");
    }

    const isMatch = bcrypt.compareSync(validation.value.password, user.passwordHash);
    if (!isMatch) {
      throw errUnauthorized("Invalid email or password");
    }

    return buildAuthResponse({ id: user.id, name: user.name, email: user.email }, user.role);
  },
};
