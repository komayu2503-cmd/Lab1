import { all, get, run } from "../db/client.js";
import { categoriesRepository } from "./categories.repository.js";
import type { CreatePostDto, Post, PostListQuery, UpdatePostDto } from "../types.js";

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
    categoryId: row.categoryId,
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

function buildWhereClause(query: PostListQuery): { sql: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.q) {
    const normalizedQuery = query.q.trim().toLowerCase();
    const searchParam = `%${normalizedQuery}%`;
    conditions.push(`(
      lower(p.title) LIKE ? OR
      lower(c.name) LIKE ? OR
      lower(p.text) LIKE ? OR
      lower(p.author) LIKE ?
    )`);
    params.push(searchParam, searchParam, searchParam, searchParam);
  }

  if (query.category) {
    conditions.push(`lower(c.name) = lower(?)`);
    params.push(query.category.trim());
  }

  if (query.author) {
    conditions.push(`lower(p.author) LIKE ?`);
    params.push(`%${query.author.trim().toLowerCase()}%`);
  }

  if (query.userId !== undefined) {
    conditions.push(`p.userId = ?`);
    params.push(Number(query.userId));
  }

  const sql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { sql, params };
}

export const postsRepository = {
  count(query: PostListQuery): number {
    type CountRow = { total: number };
    const { sql: whereClause, params } = buildWhereClause(query);
    const row = get<CountRow>(
      `
      SELECT COUNT(*) AS total
      FROM posts p
      JOIN categories c ON c.id = p.categoryId
      ${whereClause};
    `,
      params
    );
    return row?.total ?? 0;
  },

  getAll(query: PostListQuery): Post[] {
    const { sql: whereClause, params } = buildWhereClause(query);
    const orderByClause = getOrderByClause(query.sortBy, query.sortOrder);
    const pageSize = query.limit ?? 5;
    const page = Math.max(1, query.page ?? 1);
    const offset = (page - 1) * pageSize;
    const limitClause = `LIMIT ${pageSize} OFFSET ${offset}`;

    return all<PostRow>(
      `
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
    `,
      params
    ).map(mapRow);
  },

  getById(id: string): Post | undefined {
    const row = get<PostRow>(
      `
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
      WHERE p.id = ?;
    `,
      [id]
    );
    return row ? mapRow(row) : undefined;
  },

  create(input: CreatePostDto): Post {
    const category = categoriesRepository.getByName(input.category)!;
    const now = new Date().toISOString();
    const postId = `post-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    run(
      `
      INSERT INTO posts (id, title, categoryId, text, author, userId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `,
      [postId, input.title, category.id, input.text, input.author, input.userId ?? null, now]
    );

    return this.getById(postId)!;
  },

  update(id: string, input: UpdatePostDto): Post | undefined {
    const current = this.getById(id);

    if (!current) {
      return undefined;
    }

    const nextCategoryId = input.category
      ? categoriesRepository.getByName(input.category)?.id ?? current.categoryId
      : current.categoryId;
    const nextUserId = input.userId !== undefined ? input.userId : current.userId;
    const now = new Date().toISOString();

    run(
      `
      UPDATE posts
      SET
        title = ?,
        categoryId = ?,
        text = ?,
        author = ?,
        userId = ?,
        updatedAt = ?
      WHERE id = ?;
    `,
      [
        input.title ?? current.title,
        nextCategoryId,
        input.text ?? current.text,
        input.author ?? current.author,
        nextUserId ?? null,
        now,
        id
      ]
    );

    return this.getById(id);
  },

  delete(id: string): boolean {
    return run(`DELETE FROM posts WHERE id = ?;`, [id]).changes > 0;
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
  },

  getAuthorStats(): { author: string; postCount: number }[] {
    type AuthorStatsRow = { author: string; postCount: number };
    return all<AuthorStatsRow>(`
      SELECT
        p.author AS author,
        COUNT(p.id) AS postCount
      FROM posts p
      GROUP BY lower(p.author)
      ORDER BY postCount DESC, p.author ASC;
    `);
  },

  getCategoryPostStats(): { categories: { category: string; postCount: number }[]; averagePostsPerCategory: number } {
    type CategoryStatsRow = { category: string; postCount: number };
    const categories = all<CategoryStatsRow>(`
      SELECT
        c.name AS category,
        COUNT(p.id) AS postCount
      FROM categories c
      LEFT JOIN posts p ON p.categoryId = c.id
      GROUP BY c.name
      ORDER BY c.name ASC;
    `);

    const totalPosts = categories.reduce((sum, cat) => sum + cat.postCount, 0);
    const averagePostsPerCategory = categories.length > 0 ? totalPosts / categories.length : 0;

    return {
      categories,
      averagePostsPerCategory
    };
  }
};