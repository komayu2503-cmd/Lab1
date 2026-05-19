import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config.js';
import type {
  ApiErrorBody,
  AuthResponseDto,
  CategoryDto,
  CreatePostDto,
  LoginDto,
  ListResponse,
  PostDto,
  RegisterDto,
  UpdatePostDto,
  UserDto,
} from './dtos.js';
import { ApiError } from './dtos.js';

const TOKEN_STORAGE_KEY = 'lab5.jwtToken';
const USER_STORAGE_KEY = 'lab5.currentUser';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getCurrentUser(): UserDto | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as UserDto;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserDto): void {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearCurrentUser(): void {
  localStorage.removeItem(USER_STORAGE_KEY);
}

export function clearAuthState(): void {
  clearAuthToken();
  clearCurrentUser();
  window.dispatchEvent(new Event('auth-state-changed')); 
}

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

  const token = getAuthToken();
  const currentUser = getCurrentUser();

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(currentUser?.id ? { 'X-Demo-UserId': String(currentUser.id) } : {}),
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

    if (response.status === 401 && token) {
      clearAuthState();
    }

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

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function register(data: RegisterDto): Promise<AuthResponseDto> {
  const result = await request<AuthResponseDto>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  setAuthToken(result.token);
  setCurrentUser(result.user);
  return result;
}

export async function login(data: LoginDto): Promise<AuthResponseDto> {
  const result = await request<AuthResponseDto>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  setAuthToken(result.token);
  setCurrentUser(result.user);
  return result;
}

export function logout(): void {
  clearAuthState();
}
