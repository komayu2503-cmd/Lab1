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
 * 
 * SECURITY FIX: Using DOM API instead of innerHTML to prevent XSS.
 */
export function setListStatus(
  tbodyEl: HTMLTableSectionElement,
  status: 'loading' | 'empty' | 'error',
  message = '',
): void {
  tbodyEl.innerHTML = '';
  const tr = document.createElement('tr');
  const td = document.createElement('td');
  td.colSpan = 6;
  td.className = status === 'error' ? 'status-cell status-error' : 'status-cell';

  if (status === 'loading') {
    td.textContent = '⏳ Завантаження…';
  } else if (status === 'empty') {
    td.textContent = '📭 Постів немає';
  } else {
    // For error status, use textContent to prevent XSS
    const icon = document.createTextNode('❌ ');
    const msgNode = document.createTextNode(message);
    td.appendChild(icon);
    td.appendChild(msgNode);
  }

  tr.appendChild(td);
  tbodyEl.appendChild(tr);
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
    const shortText = post.text.length > 200 ? post.text.slice(0, 200) + '…' : post.text;

    // Create cells using DOM API for security
    // Cell 1: Title
    const tdTitle = document.createElement('td');
    tdTitle.textContent = post.title;
    tr.appendChild(tdTitle);

    // Cell 2: Category
    const tdCategory = document.createElement('td');
    tdCategory.textContent = post.category;
    tr.appendChild(tdCategory);

    // Cell 3: Short text
    const tdText = document.createElement('td');
    tdText.textContent = shortText;
    tr.appendChild(tdText);

    // Cell 4: Author
    const tdAuthor = document.createElement('td');
    tdAuthor.textContent = post.author;
    tr.appendChild(tdAuthor);

    // Cell 5: Date
    const tdDate = document.createElement('td');
    tdDate.textContent = formatDate(post.createdAt);
    tr.appendChild(tdDate);

    // Cell 6: Actions
    const tdActions = document.createElement('td');
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-with-loader';
    editBtn.dataset.action = 'edit';
    editBtn.dataset.id = post.id;
    const editSpan = document.createElement('span');
    editSpan.className = 'btn-text';
    editSpan.textContent = 'Редагувати';
    const editLoader = document.createElement('span');
    editLoader.className = 'loader';
    editLoader.hidden = true;
    editBtn.appendChild(editSpan);
    editBtn.appendChild(editLoader);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-with-loader';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.dataset.id = post.id;
    const deleteSpan = document.createElement('span');
    deleteSpan.className = 'btn-text';
    deleteSpan.textContent = 'Видалити';
    const deleteLoader = document.createElement('span');
    deleteLoader.className = 'loader';
    deleteLoader.hidden = true;
    deleteBtn.appendChild(deleteSpan);
    deleteBtn.appendChild(deleteLoader);
    
    tdActions.appendChild(editBtn);
    tdActions.appendChild(deleteBtn);
    tr.appendChild(tdActions);

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
