import type { CreatePostDto, Detail, PostListQuery, UpdatePostDto } from "../types.js";
import { countWords, isValidEmail } from "../utils/validators.js";

type PostValidationDeps = {
  categoryExists: (category: string) => boolean;
  userExists: (userId: number) => boolean;
  categoriesLabel: string;
};

export function parsePostListQuery(input: Record<string, unknown>): PostListQuery {
  const sortBy = input.sortBy;
  const sortOrder = input.sortOrder;
  const query: PostListQuery = {};

  if (typeof input.q === 'string') {
    query.q = input.q.trim();
  }

  if (typeof input.category === 'string') {
    query.category = input.category;
  }

  if (typeof input.author === 'string') {
    query.author = input.author;
  }

  if (input.userId !== undefined && input.userId !== null && input.userId !== '') {
    query.userId = Number(input.userId);
  }

  if (sortBy === 'title' || sortBy === 'category' || sortBy === 'author' || sortBy === 'createdAt' || sortBy === 'updatedAt') {
    query.sortBy = sortBy;
  }

  if (sortOrder === 'asc' || sortOrder === 'desc') {
    query.sortOrder = sortOrder;
  }

  return query;
}

export function validateCreatePostDto(input: unknown, deps: PostValidationDeps): { details: Detail[]; value?: CreatePostDto } {
  const details: Detail[] = [];
  const body = input as Record<string, unknown>;
  const title = body.title;
  const category = body.category;
  const text = body.text;
  const author = body.author;
  const userId = body.userId;

  if (typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 120) {
    details.push({ field: 'title', message: 'title is required and must be 3-120 characters' });
  }

  if (typeof category !== 'string' || !deps.categoryExists(category)) {
    details.push({ field: 'category', message: `category must be one of: ${deps.categoriesLabel}` });
  }

  if (typeof text !== 'string' || countWords(text) === 0 || countWords(text) > 200) {
    details.push({ field: 'text', message: 'text is required and must be 1-200 words' });
  }

  if (typeof author !== 'string' || !isValidEmail(author)) {
    details.push({ field: 'author', message: 'author must be a valid email address' });
  }

  const normalizedUserId = normalizeUserId(userId, deps, details);

  if (details.length > 0) {
    return { details };
  }

  const validTitle = title as string;
  const validCategory = category as string;
  const validText = text as string;
  const validAuthor = author as string;

  return {
    details,
    value: {
      title: validTitle.trim(),
      category: validCategory,
      text: validText.trim(),
      author: validAuthor.trim(),
      userId: normalizedUserId
    }
  };
}

export function validateUpdatePostDto(input: unknown, deps: PostValidationDeps): { details: Detail[]; value?: UpdatePostDto } {
  const details: Detail[] = [];
  const body = input as Record<string, unknown>;
  const nextValue: UpdatePostDto = {};

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length < 3 || body.title.trim().length > 120) {
      details.push({ field: 'title', message: 'title must be 3-120 characters' });
    } else {
      nextValue.title = body.title.trim();
    }
  }

  if (body.category !== undefined) {
    if (typeof body.category !== 'string' || !deps.categoryExists(body.category)) {
      details.push({ field: 'category', message: `category must be one of: ${deps.categoriesLabel}` });
    } else {
      nextValue.category = body.category;
    }
  }

  if (body.text !== undefined) {
    if (typeof body.text !== 'string' || countWords(body.text) === 0 || countWords(body.text) > 200) {
      details.push({ field: 'text', message: 'text must be 1-200 words' });
    } else {
      nextValue.text = body.text.trim();
    }
  }

  if (body.author !== undefined) {
    if (typeof body.author !== 'string' || !isValidEmail(body.author)) {
      details.push({ field: 'author', message: 'author must be a valid email address' });
    } else {
      nextValue.author = body.author.trim();
    }
  }

  if (body.userId !== undefined) {
    nextValue.userId = normalizeUserId(body.userId, deps, details);
  }

  if (details.length > 0) {
    return { details };
  }

  return { details, value: nextValue };
}

function normalizeUserId(input: unknown, deps: PostValidationDeps, details: Detail[]): number | null {
  if (input === undefined || input === null) {
    return null;
  }

  const parsed = Number(input);

  if (Number.isNaN(parsed)) {
    details.push({ field: 'userId', message: 'userId must be a number' });
    return null;
  }

  if (!deps.userExists(parsed)) {
    details.push({ field: 'userId', message: 'userId does not exist' });
    return null;
  }

  return parsed;
}