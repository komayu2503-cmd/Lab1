// ─── Backend entity shapes ────────────────────────────────────────────────────

export interface UserDto {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export interface CategoryDto {
  id: number;
  name: string;
  createdAt: string;
}

export interface PostDto {
  id: string;
  title: string;
  category: string;
  text: string;
  author: string;
  userId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

// ─── Mutation payloads ────────────────────────────────────────────────────────

export interface CreatePostDto {
  title: string;
  category: string;
  text: string;
  author: string;
  userId?: number | null;
}

export type UpdatePostDto = Partial<CreatePostDto>;

// ─── Error shapes ─────────────────────────────────────────────────────────────

/** Single field-level validation error returned by the backend. */
export interface ErrorDetail {
  field: string;
  message: string;
}

/** Shape of every non-2xx JSON body from the backend. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details: ErrorDetail[];
  };
}

/**
 * Thrown by apiClient when the backend returns a non-2xx status
 * or when the network/timeout fails.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: ErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
