import { errNotFound, errValidation, errForbidden, errUnauthorized } from "../errors.js";
import { postToDto } from "../mappers.js";
import { parsePostListQuery, validateCreatePostDto, validateUpdatePostDto } from "../dtos/post.schemas.js";
import { categoriesRepository } from "../repositories/categories.repository.js";
import { postsRepository } from "../repositories/posts.repository.js";
import { usersRepository } from "../repositories/users.repository.js";
import type { ListResponse, PostDto } from "../types.js";

function getPostValidationDeps() {
  return {
    categoryExists: (category: string) => categoriesRepository.exists(category),
    userExists: (userId: number) => usersRepository.getById(userId) !== undefined,
    getCategoriesLabel: () => categoriesRepository.getAll().map(c => c.name).join(', ')
  };
}

export const postsService = {
  list(input: Record<string, unknown>): ListResponse<PostDto> {
    const query = parsePostListQuery(input);
    const totalItems = postsRepository.count(query);
    const pageSize = query.limit ?? 5;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const page = Math.min(Math.max(1, query.page ?? 1), totalPages);
    const items = postsRepository.getAll({ ...query, page, limit: pageSize }).map(postToDto);

    return { items, totalItems, totalPages, page, pageSize };
  },

  getById(id: string): PostDto {
    const post = postsRepository.getById(id);

    if (!post) {
      throw errNotFound('Post not found');
    }

    return postToDto(post);
  },

  create(input: unknown, currentUserId: number): PostDto {
    const validation = validateCreatePostDto(input, getPostValidationDeps());

    if (validation.details.length > 0 || !validation.value) {
      throw errValidation(validation.details);
    }

    const currentUser = usersRepository.getById(currentUserId);
    if (!currentUser) {
      throw errUnauthorized('User not authenticated');
    }

    validation.value.author = currentUser.email;
    validation.value.userId = currentUserId;

    return postToDto(postsRepository.create(validation.value));
  },

  update(id: string, input: unknown, currentUserId: number): PostDto {
    const post = postsRepository.getById(id);

    if (!post) {
      throw errNotFound('Post not found');
    }

    // IDOR protection: Only owner or user with null userId can update
    if (post.userId !== null && post.userId !== currentUserId) {
      throw errForbidden('Access denied: you can only update your own posts');
    }

    const validation = validateUpdatePostDto(input, getPostValidationDeps());

    if (validation.details.length > 0 || !validation.value) {
      throw errValidation(validation.details);
    }

    const currentUser = usersRepository.getById(currentUserId);
    if (!currentUser) {
      throw errUnauthorized('User not authenticated');
    }

    validation.value.author = currentUser.email;
    validation.value.userId = currentUserId;

    const updated = postsRepository.update(id, validation.value);

    if (!updated) {
      throw errNotFound('Post not found');
    }

    return postToDto(updated);
  },

  delete(id: string, currentUserId: number): void {
    const post = postsRepository.getById(id);

    if (!post) {
      throw errNotFound('Post not found');
    }

    // IDOR protection: Only owner or user with null userId can delete
    if (post.userId !== null && post.userId !== currentUserId) {
      throw errForbidden('Access denied: you can only delete your own posts');
    }

    if (!postsRepository.delete(id)) {
      throw errNotFound('Post not found');
    }
  },

  stats(): { category: string; postCount: number; latestPost: string | null }[] {
    return postsRepository.getStats();
  },

  authorStats(): { author: string; postCount: number }[] {
    return postsRepository.getAuthorStats();
  },

  categoryPostStats(): { categories: { category: string; postCount: number }[]; averagePostsPerCategory: number } {
    return postsRepository.getCategoryPostStats();
  }
};