import { errNotFound, errValidation } from "../errors.js";
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
    categoriesLabel: categoriesRepository.getAll().join(', ')
  };
}

export const postsService = {
  list(input: Record<string, unknown>): ListResponse<PostDto> {
    const query = parsePostListQuery(input);
    const allItems = postsRepository.getAll(query).map(postToDto);
    const totalItems = allItems.length;
    const pageSize = query.limit ?? 5;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const page = Math.min(query.page ?? 1, totalPages);
    const startIndex = (page - 1) * pageSize;
    const items = allItems.slice(startIndex, startIndex + pageSize);

    return {
      items,
      totalItems,
      totalPages,
      page,
      pageSize
    };
  },

  getById(id: string): PostDto {
    const post = postsRepository.getById(id);

    if (!post) {
      throw errNotFound('Post not found');
    }

    return postToDto(post);
  },

  create(input: unknown): PostDto {
    const validation = validateCreatePostDto(input, getPostValidationDeps());

    if (validation.details.length > 0 || !validation.value) {
      throw errValidation(validation.details);
    }

    return postToDto(postsRepository.create(validation.value));
  },

  update(id: string, input: unknown): PostDto {
    if (!postsRepository.getById(id)) {
      throw errNotFound('Post not found');
    }

    const validation = validateUpdatePostDto(input, getPostValidationDeps());

    if (validation.details.length > 0 || !validation.value) {
      throw errValidation(validation.details);
    }

    const updated = postsRepository.update(id, validation.value);

    if (!updated) {
      throw errNotFound('Post not found');
    }

    return postToDto(updated);
  },

  delete(id: string): void {
    if (!postsRepository.delete(id)) {
      throw errNotFound('Post not found');
    }
  }
};