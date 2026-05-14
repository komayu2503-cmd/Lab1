export type User = { id: number; name: string; email: string };

export type Category = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt?: string;
};

export type Post = {
  id: string;
  title: string;
  category: string;
  text: string;
  author: string;
  userId: number | null;
  createdAt: string;
  updatedAt?: string;
};
export type {
  ApiErrorCode,
  CategoryDto,
  CreateCategoryDto,
  CreatePostDto,
  CreateUserDto,
  Detail,
  ErrorResponse,
  ListResponse,
  PostDto,
  UpdateCategoryDto,
  UpdatePostDto,
  UpdateUserDto,
  UserDto,
} from "../shared/contracts.js";

export type PostListQuery = {
  q?: string;
  category?: string;
  author?: string;
  userId?: number;
  sortBy?: 'title' | 'category' | 'author' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};
