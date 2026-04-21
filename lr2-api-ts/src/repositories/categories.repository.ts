import { all, get, run, sqlString } from "../db/client.js";
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
    return get<Category>(`
      SELECT id, name, createdAt, updatedAt
      FROM categories
      WHERE id = ${Number(id)};
    `);
  },

  getByName(name: string): Category | undefined {
    return get<Category>(`
      SELECT id, name, createdAt, updatedAt
      FROM categories
      WHERE lower(name) = lower(${sqlString(name.trim())});
    `);
  },

  exists(category: string): boolean {
    return this.getByName(category) !== undefined;
  },

  nameExists(name: string, excludeId?: number): boolean {
    const sql = excludeId === undefined
      ? `SELECT id FROM categories WHERE lower(name) = lower(${sqlString(name.trim())}) LIMIT 1;`
      : `SELECT id FROM categories WHERE lower(name) = lower(${sqlString(name.trim())}) AND id != ${Number(excludeId)} LIMIT 1;`;

    return get<{ id: number }>(sql) !== undefined;
  },

  create(input: { name: string }): Category {
    const now = new Date().toISOString();
    const result = run(`
      INSERT INTO categories (name, createdAt)
      VALUES (${sqlString(input.name.trim())}, ${sqlString(now)});
    `);

    return this.getById(result.lastInsertRowid)!;
  },

  update(id: number, input: { name?: string }): Category | undefined {
    const category = this.getById(id);

    if (!category) {
      return undefined;
    }

    const nextName = input.name?.trim() ?? category.name;
    const now = new Date().toISOString();

    run(`
      UPDATE categories
      SET name = ${sqlString(nextName)}, updatedAt = ${sqlString(now)}
      WHERE id = ${Number(id)};
    `);

    return this.getById(id);
  },

  delete(id: number): boolean {
    return run(`DELETE FROM categories WHERE id = ${Number(id)};`).changes > 0;
  }
};