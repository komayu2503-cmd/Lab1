import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config.js';
import type {
  ApiErrorBody,
  CategoryDto,
  CreatePostDto,
  ListResponse,
  PostDto,
  UpdatePostDto,
  UserDto,
} from './dtos.js';
import { ApiError } from './dtos.js';

// ─── Core request ─────────────────────────────────────────────────────────────

/**
 * Generic fetch wrapper.
 * - Uses AbortController to cancel requests after REQUEST_TIMEOUT_MS.
 * - Parses backend error format { error: { code, message, details } }.
 * - Throws ApiError for all non-2xx responses and network/timeout failures.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(
        0,
        'TIMEOUT',
        'Запит перевищив ліміт часу (10 с). Перевірте підключення та спробуйте знову.',
      );
    }
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      "Не вдалося з'єднатися з сервером. Перевірте, чи запущений бекенд.",
    );
  } finally {
    clearTimeout(timer);
  }

  // 204 No Content – no body to parse
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const json: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const body = json as ApiErrorBody | null;
    const code = body?.error?.code ?? 'UNKNOWN';
    const message = body?.error?.message ?? `HTTP ${response.status}`;
    const details = body?.error?.details ?? [];
    throw new ApiError(response.status, code, message, details);
  }

  return json as T;
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export function getPosts(
  params: Record<string, string | number> = {},
): Promise<ListResponse<PostDto>> {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  ).toString();
  return request<ListResponse<PostDto>>(`/posts${qs ? `?${qs}` : ''}`);
}

export function createPost(data: CreatePostDto): Promise<PostDto> {
  return request<PostDto>('/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updatePost(id: string, data: UpdatePostDto): Promise<PostDto> {
  return request<PostDto>(`/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deletePost(id: string): Promise<void> {
  return request<void>(`/posts/${id}`, { method: 'DELETE' });
}

export function getPostById(id: string): Promise<PostDto> {
  return request<PostDto>(`/posts/${id}`);
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function getUsers(): Promise<ListResponse<UserDto>> {
  return request<ListResponse<UserDto>>('/users');
}

// ─── Categories ───────────────────────────────────────────────────────────────

export function getCategories(): Promise<ListResponse<CategoryDto>> {
  return request<ListResponse<CategoryDto>>('/categories');
}
