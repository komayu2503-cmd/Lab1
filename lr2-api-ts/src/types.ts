export type User = { id: number; name: string; email: string };

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

export type AppData = { users: User[]; categories: string[]; posts: Post[] };

export type Detail = { field: string; message: string };

export type ApiErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR';

export type ErrorResponse = {
  error: {
    code: ApiErrorCode;
    message: string;
    details: Detail[];
  };
};

export type SuccessOrThrow<T> = T;

export type ListResponse<T> = {
  items: T[];
  total: number;
};

export type UserDto = {
  id: number;
  name: string;
  email: string;
};

export type PostDto = {
  id: string;
  title: string;
  category: string;
  text: string;
  author: string;
  userId: number | null;
  createdAt: string;
  updatedAt?: string;
};

export type CreateUserDto = {
  name: string;
  email: string;
};

export type UpdateUserDto = {
  name?: string;
  email?: string;
};

export type CreatePostDto = {
  title: string;
  category: string;
  text: string;
  author: string;
  userId: number | null;
};

export type UpdatePostDto = {
  title?: string;
  category?: string;
  text?: string;
  author?: string;
  userId?: number | null;
};

export type PostListQuery = {
  q?: string;
  category?: string;
  author?: string;
  userId?: number;
  sortBy?: 'title' | 'category' | 'author' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
};
