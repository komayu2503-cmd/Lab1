import { all, get, getDb, run } from "../db/client.js";
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
    return get<User>(
      `
      SELECT id, name, email
      FROM users
      WHERE id = ?;
    `,
      [id]
    );
  },

  emailExists(email: string, excludeId?: number): boolean {
    const trimmedEmail = email.trim();
    if (excludeId === undefined) {
      return get<{ id: number }>(
        `SELECT id FROM users WHERE lower(email) = lower(?) LIMIT 1;`,
        [trimmedEmail]
      ) !== undefined;
    }
    return get<{ id: number }>(
      `SELECT id FROM users WHERE lower(email) = lower(?) AND id != ? LIMIT 1;`,
      [trimmedEmail, excludeId]
    ) !== undefined;
  },

  create(input: { name: string; email: string }): User {
    const now = new Date().toISOString();
    const result = run(
      `
      INSERT INTO users (name, email, createdAt)
      VALUES (?, ?, ?);
    `,
      [input.name.trim(), input.email.trim(), now]
    );

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

    run(
      `
      UPDATE users
      SET name = ?, email = ?, updatedAt = ?
      WHERE id = ?;
    `,
      [nextName, nextEmail, now, id]
    );

    return this.getById(id);
  },

  delete(id: number): boolean {
    const user = this.getById(id);
    if (!user) {
      return false;
    }

    const db = getDb();
    let deleted = false;

    const transaction = db.transaction(() => {
      run(
        `DELETE FROM posts WHERE userId = ? OR lower(author) = lower(?);`,
        [id, user.email]
      );
      const result = run(`DELETE FROM users WHERE id = ?;`, [id]);
      deleted = result.changes > 0;
    });

    transaction();
    return deleted;
  }
};