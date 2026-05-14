import type { CategoryDto, ErrorDetail, PostDto, UserDto } from './dtos.js';
import { ApiError } from './dtos.js';

// ─── Utilities ────────────────────────────────────────────────────────────────

export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ─── List status (loading / empty / error) ───────────────────────────────────

/**
 * Replaces the table body content with a single-row status cell.
 * Used to show loading spinner, empty state, or error message.
 */
export function setListStatus(
  tbodyEl: HTMLTableSectionElement,
  status: 'loading' | 'empty' | 'error',
  message = '',
): void {
  const colSpan = 6;
  let content: string;
  if (status === 'loading') {
    content = `<td colspan="${colSpan}" class="status-cell">⏳ Завантаження…</td>`;
  } else if (status === 'empty') {
    content = `<td colspan="${colSpan}" class="status-cell">📭 Постів немає</td>`;
  } else {
    content = `<td colspan="${colSpan}" class="status-cell status-error">❌ ${escapeHtml(message)}</td>`;
  }
  tbodyEl.innerHTML = `<tr>${content}</tr>`;
}

// ─── Posts table ─────────────────────────────────────────────────────────────

export function renderPosts(
  tbodyEl: HTMLTableSectionElement,
  posts: PostDto[],
  sortDirection: 'asc' | 'desc',
  sortDirectionIconEl: HTMLElement | null,
): void {
  tbodyEl.innerHTML = '';
  posts.forEach((post) => {
    const tr = document.createElement('tr');
    const shortText =
      post.text.length > 200 ? post.text.slice(0, 200) + '…' : post.text;
    tr.innerHTML = `
      <td>${escapeHtml(post.title)}</td>
      <td>${escapeHtml(post.category)}</td>
      <td>${escapeHtml(shortText)}</td>
      <td>${escapeHtml(post.author)}</td>
      <td>${escapeHtml(formatDate(post.createdAt))}</td>
      <td>
        <button data-action="edit" class="btn-with-loader" data-id="${escapeHtml(post.id)}">
            <span class="btn-text">Редагувати</span>
            <span class="loader" hidden></span>
        </button>
        <button data-action="delete" class="btn-with-loader" data-id="${escapeHtml(post.id)}">
            <span class="btn-text">Видалити</span>
            <span class="loader" hidden></span>
        </button>
      </td>
    `;
    tbodyEl.appendChild(tr);
  });

  if (sortDirectionIconEl) {
    sortDirectionIconEl.textContent = sortDirection === 'desc' ? '↓' : '↑';
  }
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export function renderPagination(
  pageSelectEl: HTMLSelectElement | null,
  paginationSummaryEl: HTMLElement | null,
  prevBtn: HTMLButtonElement | null,
  nextBtn: HTMLButtonElement | null,
  currentPage: number,
  totalPages: number,
  totalItems: number,
): void {
  if (!pageSelectEl || !paginationSummaryEl || !prevBtn || !nextBtn) return;

  pageSelectEl.innerHTML = '';
  for (let p = 1; p <= totalPages; p++) {
    const option = document.createElement('option');
    option.value = String(p);
    option.textContent = String(p);
    option.selected = p === currentPage;
    pageSelectEl.appendChild(option);
  }

  paginationSummaryEl.textContent = `Всього елементів: ${totalItems} | Сторінок: ${totalPages}`;
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
}

// ─── Dropdowns ───────────────────────────────────────────────────────────────

export function renderUserOptions(
  selectEl: HTMLSelectElement | null,
  users: UserDto[],
): void {
  if (!selectEl) return;
  // keep the placeholder option
  const placeholder = selectEl.querySelector<HTMLOptionElement>('option[value=""]');
  selectEl.innerHTML = '';
  if (placeholder) selectEl.appendChild(placeholder);
  users.forEach((u) => {
    const opt = document.createElement('option');
    opt.value = String(u.id);
    opt.textContent = `${u.name} (${u.email})`;
    selectEl.appendChild(opt);
  });
}

export function renderCategoryOptions(
  selectEl: HTMLSelectElement | null,
  categories: CategoryDto[],
): void {
  if (!selectEl) return;
  const placeholder = selectEl.querySelector<HTMLOptionElement>('option[value=""]');
  selectEl.innerHTML = '';
  if (placeholder) selectEl.appendChild(placeholder);
  categories.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.name;
    opt.textContent = c.name;
    selectEl.appendChild(opt);
  });
}

// ─── Notice banner ────────────────────────────────────────────────────────────

export function showNotice(
  noticeEl: HTMLElement | null,
  type: 'success' | 'error',
  message: string,
  durationMs = 4000,
): void {
  if (!noticeEl) return;
  noticeEl.textContent = message;
  noticeEl.className = `notice notice-${type}`;
  noticeEl.hidden = false;
  setTimeout(() => {
    noticeEl.hidden = true;
    noticeEl.textContent = '';
  }, durationMs);
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

/** Disable or enable all interactive elements inside a form. */
export function setFormEnabled(form: HTMLFormElement | null, enabled: boolean): void {
  if (!form) return;
  form
    .querySelectorAll<
      HTMLButtonElement | HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >('button, input, textarea, select')
    .forEach((el) => {
      el.disabled = !enabled;
    });
}

/** Display per-field validation errors returned by the backend (detail array). */
export function showFieldErrors(details: ErrorDetail[]): void {
  details.forEach(({ field, message }) => {
    const errEl = document.getElementById(`${field}Error`);
    const inputEl = document.getElementById(field) as HTMLInputElement | null;
    if (errEl) errEl.textContent = message;
    if (inputEl) inputEl.classList.add('invalid');
  });
}

/** Remove all inline validation errors. */
export function clearFieldErrors(): void {
  document.querySelectorAll<HTMLElement>('.error-message').forEach((el) => {
    el.textContent = '';
  });
  document.querySelectorAll<HTMLElement>('.invalid').forEach((el) => {
    el.classList.remove('invalid');
  });
}
// ─── Button loaders ──────────────────────────────────────────────────────────

export function toggleButtonLoader(button: HTMLButtonElement, showLoader: boolean): void {
  const loader = button.querySelector<HTMLElement>('.loader');
  const text = button.querySelector<HTMLElement>('.btn-text');
  if (loader && text) {
    text.style.visibility = showLoader ? 'hidden' : 'visible';
    loader.hidden = !showLoader;
  }
}
// ─── Error humanization ───────────────────────────────────────────────────────

/**
 * Convert any thrown value to a user-friendly Ukrainian string.
 * Handles: timeout, network failure, 404, 400 validation, 500, unknown.
 */
export function getApiErrorMsg(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'TIMEOUT':
        return "Запит перевищив ліміт часу. Перевірте з'єднання та спробуйте знову.";
      case 'NETWORK_ERROR':
        return "Не вдалося з'єднатися з сервером. Перевірте, чи запущений бекенд.";
      case 'NOT_FOUND':
        return 'Запис не знайдено (404).';
      case 'VALIDATION_ERROR':
        return 'Дані не пройшли валідацію на сервері — перевірте поля форми.';
      case 'CONFLICT':
        return 'Конфлікт даних — такий запис вже існує.';
      case 'INTERNAL_ERROR':
        return 'Внутрішня помилка сервера (500). Спробуйте пізніше.';
      default:
        return err.message || 'Невідома помилка сервера.';
    }
  }
  if (err instanceof Error) return err.message;
  return 'Невідома помилка.';
}
