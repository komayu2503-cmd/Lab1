import { all, get, run, sqlString } from "../db/client.js";
import type { User } from "../types.js";

export const usersRepository = {
  getAll(): User[] {
    return all<User>(`
      SELECT id, name, email
      FROM users
      ORDER BY id ASC;
    `);
  },

  getById(id: number): User | undefined {
    return get<User>(`
      SELECT id, name, email
      FROM users
      WHERE id = ${Number(id)};
    `);
  },

  emailExists(email: string, excludeId?: number): boolean {
    const sql = excludeId === undefined
      ? `SELECT id FROM users WHERE lower(email) = lower(${sqlString(email.trim())}) LIMIT 1;`
      : `SELECT id FROM users WHERE lower(email) = lower(${sqlString(email.trim())}) AND id != ${Number(excludeId)} LIMIT 1;`;

    return get<{ id: number }>(sql) !== undefined;
  },

  create(input: { name: string; email: string }): User {
    const now = new Date().toISOString();
    const result = run(`
      INSERT INTO users (name, email, createdAt)
      VALUES (${sqlString(input.name.trim())}, ${sqlString(input.email.trim())}, ${sqlString(now)});
    `);

    return this.getById(result.lastInsertRowid)!;
  },

  update(id: number, input: { name?: string; email?: string }): User | undefined {
    const user = this.getById(id);

    if (!user) {
      return undefined;
    }

    const nextName = input.name ?? user.name;
    const nextEmail = input.email ?? user.email;
    const now = new Date().toISOString();

    run(`
      UPDATE users
      SET name = ${sqlString(nextName)}, email = ${sqlString(nextEmail)}, updatedAt = ${sqlString(now)}
      WHERE id = ${Number(id)};
    `);

    return this.getById(id);
  },

  delete(id: number): boolean {
    return run(`DELETE FROM users WHERE id = ${Number(id)};`).changes > 0;
  }
};