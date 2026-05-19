import { all, get, run } from "../db/client.js";
import type { Category } from "../types.js";

export const categoriesRepository = {
  getAll(): Category[] {
    return all<Category>(`
      SELECT id, name, createdAt, updatedAt
      FROM categories
      ORDER BY name ASC;
    `);
  },

  getById(id: number): Category | undefined {
    return get<Category>(
      `
      SELECT id, name, createdAt, updatedAt
      FROM categories
      WHERE id = ?;
    `,
      [id]
    );
  },

  getByName(name: string): Category | undefined {
    return get<Category>(
      `
      SELECT id, name, createdAt, updatedAt
      FROM categories
      WHERE lower(name) = lower(?);
    `,
      [name.trim()]
    );
  },

  exists(category: string): boolean {
    return this.getByName(category) !== undefined;
  },

  nameExists(name: string, excludeId?: number): boolean {
    const trimmedName = name.trim();
    if (excludeId === undefined) {
      return get<{ id: number }>(
        `SELECT id FROM categories WHERE lower(name) = lower(?) LIMIT 1;`,
        [trimmedName]
      ) !== undefined;
    }
    return get<{ id: number }>(
      `SELECT id FROM categories WHERE lower(name) = lower(?) AND id != ? LIMIT 1;`,
      [trimmedName, excludeId]
    ) !== undefined;
  },

  create(input: { name: string }): Category {
    const now = new Date().toISOString();
    const result = run(
      `
      INSERT INTO categories (name, createdAt)
      VALUES (?, ?);
    `,
      [input.name.trim(), now]
    );

    return this.getById(result.lastInsertRowid)!;
  },

  update(id: number, input: { name?: string }): Category | undefined {
    const category = this.getById(id);

    if (!category) {
      return undefined;
    }

    const nextName = input.name?.trim() ?? category.name;
    const now = new Date().toISOString();

    run(
      `
      UPDATE categories
      SET name = ?, updatedAt = ?
      WHERE id = ?;
    `,
      [nextName, now, id]
    );

    return this.getById(id);
  },

  delete(id: number): boolean {
    return run(`DELETE FROM categories WHERE id = ?;`, [id]).changes > 0;
  }
};