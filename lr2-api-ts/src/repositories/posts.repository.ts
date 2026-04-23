import { all, get, run, sqlNullableNumber, sqlString } from "../db/client.js";
import { categoriesRepository } from "./categories.repository.js";
import type { Post, PostListQuery } from "../types.js";

type PostRow = {
  id: string;
  title: string;
  category: string;
  categoryId: number;
  text: string;
  author: string;
  userId: number | null;
  createdAt: string;
  updatedAt: string | null;
};

function mapRow(row: PostRow): Post {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    text: row.text,
    author: row.author,
    userId: row.userId,
    createdAt: row.createdAt,
    ...(row.updatedAt ? { updatedAt: row.updatedAt } : {})
  };
}

function getOrderByClause(sortBy?: NonNullable<PostListQuery['sortBy']>, sortOrder?: NonNullable<PostListQuery['sortOrder']>): string {
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

  switch (sortBy) {
    case 'title':
      return `ORDER BY p.title ${order}`;
    case 'category':
      return `ORDER BY c.name ${order}`;
    case 'author':
      return `ORDER BY p.author ${order}`;
    case 'updatedAt':
      return `ORDER BY COALESCE(p.updatedAt, p.createdAt) ${order}`;
    case 'createdAt':
    default:
      return `ORDER BY p.createdAt ${order}`;
  }
}

function buildWhereClause(query: PostListQuery): string {
  const conditions: string[] = [];

  if (query.q) {
    const normalizedQuery = query.q.trim().toLowerCase();
    conditions.push(`(
      lower(p.title) LIKE ${sqlString(`%${normalizedQuery}%`)} OR
      lower(c.name) LIKE ${sqlString(`%${normalizedQuery}%`)} OR
      lower(p.text) LIKE ${sqlString(`%${normalizedQuery}%`)} OR
      lower(p.author) LIKE ${sqlString(`%${normalizedQuery}%`)}
    )`);
  }

  if (query.category) {
    conditions.push(`lower(c.name) = lower(${sqlString(query.category.trim())})`);
  }

  if (query.author) {
    conditions.push(`lower(p.author) LIKE ${sqlString(`%${query.author.trim().toLowerCase()}%`)}`);
  }

  if (query.userId !== undefined) {
    conditions.push(`p.userId = ${Number(query.userId)}`);
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}

function selectBaseSql(whereClause = '', orderByClause = 'ORDER BY p.createdAt DESC', limitClause = ''): string {
  return `
    SELECT
      p.id,
      p.title,
      c.name AS category,
      p.categoryId,
      p.text,
      p.author,
      p.userId,
      p.createdAt,
      p.updatedAt
    FROM posts p
    JOIN categories c ON c.id = p.categoryId
    ${whereClause}
    ${orderByClause}
    ${limitClause};
  `;
}

export const postsRepository = {
  count(query: PostListQuery): number {
    type CountRow = { total: number };
    const whereClause = buildWhereClause(query);
    const row = get<CountRow>(`
      SELECT COUNT(*) AS total
      FROM posts p
      JOIN categories c ON c.id = p.categoryId
      ${whereClause};
    `);
    return row?.total ?? 0;
  },

  getAll(query: PostListQuery): Post[] {
    const whereClause = buildWhereClause(query);
    const orderByClause = getOrderByClause(query.sortBy, query.sortOrder);
    const pageSize = query.limit ?? 5;
    const page = Math.max(1, query.page ?? 1);
    const offset = (page - 1) * pageSize;
    const limitClause = `LIMIT ${pageSize} OFFSET ${offset}`;

    return all<PostRow>(selectBaseSql(whereClause, orderByClause, limitClause)).map(mapRow);
  },

  getById(id: string): Post | undefined {
    const row = get<PostRow>(selectBaseSql(`WHERE p.id = ${sqlString(id)}`));
    return row ? mapRow(row) : undefined;
  },

  create(input: { title: string; category: string; text: string; author: string; userId: number | null }): Post {
    const category = categoriesRepository.getByName(input.category)!;
    const now = new Date().toISOString();
    const postId = `post-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    run(`
      INSERT INTO posts (id, title, categoryId, text, author, userId, createdAt)
      VALUES (
        ${sqlString(postId)},
        ${sqlString(input.title)},
        ${Number(category.id)},
        ${sqlString(input.text)},
        ${sqlString(input.author)},
        ${sqlNullableNumber(input.userId)},
        ${sqlString(now)}
      );
    `);

    return this.getById(postId)!;
  },

  update(id: string, input: { title?: string; category?: string; text?: string; author?: string; userId?: number | null }): Post | undefined {
    const current = get<PostRow>(selectBaseSql(`WHERE p.id = ${sqlString(id)}`));

    if (!current) {
      return undefined;
    }

    const nextCategoryId = input.category
      ? categoriesRepository.getByName(input.category)?.id ?? current.categoryId
      : current.categoryId;
    const nextUserId = input.userId !== undefined ? input.userId : current.userId;
    const now = new Date().toISOString();

    run(`
      UPDATE posts
      SET
        title = ${sqlString(input.title ?? current.title)},
        categoryId = ${Number(nextCategoryId)},
        text = ${sqlString(input.text ?? current.text)},
        author = ${sqlString(input.author ?? current.author)},
        userId = ${sqlNullableNumber(nextUserId)},
        updatedAt = ${sqlString(now)}
      WHERE id = ${sqlString(id)};
    `);

    return this.getById(id);
  },

  delete(id: string): boolean {
    return run(`DELETE FROM posts WHERE id = ${sqlString(id)};`).changes > 0;
  },

  getStats(): { category: string; postCount: number; latestPost: string | null }[] {
    type StatsRow = { category: string; postCount: number; latestPost: string | null };
    return all<StatsRow>(`
      SELECT
        c.name AS category,
        COUNT(p.id) AS postCount,
        MAX(p.createdAt) AS latestPost
      FROM categories c
      LEFT JOIN posts p ON p.categoryId = c.id
      GROUP BY c.id, c.name
      ORDER BY postCount DESC, c.name ASC;
    `);
  }
  
};