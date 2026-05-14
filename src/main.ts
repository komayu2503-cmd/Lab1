import {
  createPost,
  deletePost,
  getPostById,
  getCategories,
  getPosts,
  getUsers,
  updatePost,
} from './apiClient.js';
import type { CategoryDto, CreatePostDto, PostDto, UserDto } from './dtos.js';
import { ApiError } from './dtos.js';
import {
  clearFieldErrors,
  getApiErrorMsg,
  renderCategoryOptions,
  renderPagination,
  renderPosts,
  renderUserOptions,
  setFormEnabled,
  setListStatus,
  showFieldErrors,
  showNotice,
  toggleButtonLoader,
} from './ui.js';

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const postsTableBody = document.querySelector<HTMLTableSectionElement>(
  '#postsTable tbody',
)!;
const postForm = document.querySelector<HTMLFormElement>('#postForm')!;
const postIdEl = document.querySelector<HTMLInputElement>('#postId')!;
const titleEl = document.querySelector<HTMLInputElement>('#title')!;
const categoryEl = document.querySelector<HTMLSelectElement>('#category')!;
const textEl = document.querySelector<HTMLTextAreaElement>('#text')!;
const authorEl = document.querySelector<HTMLInputElement>('#author')!;
const userSelectEl = document.querySelector<HTMLSelectElement>('#userSelect')!;
const saveBtn = document.querySelector<HTMLButtonElement>('#saveBtn')!;
const clearBtn = document.querySelector<HTMLButtonElement>('#clearBtn')!;
const wordCountEl = document.querySelector<HTMLElement>('#wordCount')!;
const noticeEl = document.querySelector<HTMLElement>('#notice')!;
const sortDirectionIconEl =
  document.querySelector<HTMLElement>('#sortDirectionIcon');
const pageSelectEl = document.querySelector<HTMLSelectElement>('#pageSelect');
const paginationSummaryEl =
  document.querySelector<HTMLElement>('#paginationSummary');
const prevPageBtn = document.querySelector<HTMLButtonElement>('#prevPageBtn');
const nextPageBtn = document.querySelector<HTMLButtonElement>('#nextPageBtn');

// ─── State ────────────────────────────────────────────────────────────────────

let posts: PostDto[] = [];
let users: UserDto[] = [];
let categories: CategoryDto[] = [];
let currentPage = 1;
let totalPages = 1;
let totalItems = 0;
let sortField = 'createdAt';
let sortDirection: 'asc' | 'desc' = 'desc';
let currentEditingId: string | null = null;

const PAGE_SIZE = 10;

// ─── Word count helper ────────────────────────────────────────────────────────

function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─── Frontend validation (mirrors backend rules) ──────────────────────────────
// Rules: title required, category required, text 1-200 words, author valid email.
// These rules deliberately match the backend's validateCreatePostDto so the user
// gets instant feedback that agrees with server-side validation (no contradictions).

function setFieldError(fieldId: string, message: string): void {
  const errEl = document.getElementById(`${fieldId}Error`);
  const inputEl = document.getElementById(fieldId) as HTMLInputElement | null;
  if (errEl) errEl.textContent = message;
  if (inputEl) inputEl.classList.add('invalid');
}

function clearFieldError(fieldId: string): void {
  const errEl = document.getElementById(`${fieldId}Error`);
  const inputEl = document.getElementById(fieldId) as HTMLInputElement | null;
  if (errEl) errEl.textContent = '';
  if (inputEl) inputEl.classList.remove('invalid');
}

function validateField(fieldName: string): boolean {
  switch (fieldName) {
    case 'title': {
      if (!titleEl.value.trim()) {
        setFieldError('title', "Поле обов'язкове");
        return false;
      }
      clearFieldError('title');
      return true;
    }
    case 'category': {
      if (!categoryEl.value) {
        setFieldError('category', 'Оберіть категорію');
        return false;
      }
      clearFieldError('category');
      return true;
    }
    case 'text': {
      const words = countWords(textEl.value);
      if (words === 0) {
        setFieldError('text', "Поле обов'язкове");
        return false;
      }
      if (words > 200) {
        setFieldError('text', 'Перевищено ліміт 200 слів');
        return false;
      }
      clearFieldError('text');
      return true;
    }
    case 'author': {
      const val = authorEl.value.trim();
      if (!val) {
        setFieldError('author', "Поле обов'язкове");
        return false;
      }
      if (!/^\S+@\S+\.\S+$/.test(val)) {
        setFieldError('author', 'Невірний формат email');
        return false;
      }
      clearFieldError('author');
      return true;
    }
    default:
      return true;
  }
}

function validateAll(): boolean {
  const results = ['title', 'category', 'text', 'author'].map(validateField);
  return results.every(Boolean);
}

// ─── Posts loader ─────────────────────────────────────────────────────────────

async function loadPosts(): Promise<void> {
  setListStatus(postsTableBody, 'loading');
  try {
    const result = await getPosts({
      page: currentPage,
      limit: PAGE_SIZE,
      sortBy: sortField,
      sortOrder: sortDirection,
    });

    posts = result.items;
    totalItems = result.totalItems;
    totalPages = result.totalPages;
    currentPage = result.page;

    if (posts.length === 0) {
      setListStatus(postsTableBody, 'empty');
    } else {
      renderPosts(postsTableBody, posts, sortDirection, sortDirectionIconEl);
    }
    renderPagination(
      pageSelectEl,
      paginationSummaryEl,
      prevPageBtn,
      nextPageBtn,
      currentPage,
      totalPages,
      totalItems,
    );
  } catch (err) {
    setListStatus(postsTableBody, 'error', getApiErrorMsg(err));
  }
}

// ─── Users & categories loader ────────────────────────────────────────────────

async function loadUsersAndCategories(): Promise<void> {
  try {
    const [usersResult, catsResult] = await Promise.all([
      getUsers(),
      getCategories(),
    ]);
    users = usersResult.items;
    categories = catsResult.items;
    renderUserOptions(userSelectEl, users);
    renderCategoryOptions(categoryEl, categories);
  } catch (err) {
    // Non-fatal: the user can still manually type an email / category name
    console.error('Failed to load users/categories:', err);
  }
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

function resetForm(cancelEdit = true): void {
  postForm.reset();
  postIdEl.value = '';
  if (wordCountEl) wordCountEl.textContent = '0/200 слів';
  clearFieldErrors();
  if (cancelEdit) currentEditingId = null;
}

// ─── Save handler (create / update) ──────────────────────────────────────────

saveBtn.addEventListener('click', async () => {
  clearFieldErrors();
  if (!validateAll()) return;

  const data: CreatePostDto = {
    title: titleEl.value.trim(),
    category: categoryEl.value,
    text: textEl.value.trim(),
    author: authorEl.value.trim(),
  };

  if (userSelectEl?.value) {
    data.userId = Number(userSelectEl.value);
  }

  toggleButtonLoader(saveBtn, true);
  setFormEnabled(postForm, false);
  try {
    if (currentEditingId) {
      await updatePost(currentEditingId, data);
      showNotice(noticeEl, 'success', '✅ Пост оновлено');
    } else {
      await createPost(data);
      showNotice(noticeEl, 'success', '✅ Пост створено');
    }
    await loadPosts();
    resetForm(true);
  } catch (err) {
    // Show per-field errors from backend validation response
    if (err instanceof ApiError && err.status === 400 && err.details.length > 0) {
      showFieldErrors(err.details);
    }
    showNotice(noticeEl, 'error', getApiErrorMsg(err));
  } finally {
    toggleButtonLoader(saveBtn, false);
    setFormEnabled(postForm, true);
  }
});

clearBtn.addEventListener('click', () => resetForm(true));

// ─── Table: edit / delete ─────────────────────────────────────────────────────

postsTableBody.addEventListener('click', async (e: Event) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id!;

  if (action === 'delete') {
    if (!confirm('Ви впевнені, що хочете видалити цей пост?')) return;
    toggleButtonLoader(btn, true);
    try {
      await deletePost(id);
      showNotice(noticeEl, 'success', '🗑️ Пост видалено');
      await loadPosts();
      if (currentEditingId === id) resetForm(true);
    } catch (err) {
      showNotice(noticeEl, 'error', getApiErrorMsg(err));
    } finally {
      toggleButtonLoader(btn, false);
    }
  } else if (action === 'edit') {
    toggleButtonLoader(btn, true);
    try {
      const post = await getPostById(id);
      currentEditingId = post.id;
      postIdEl.value = post.id;
      titleEl.value = post.title;
      categoryEl.value = post.category;
      textEl.value = post.text;
      authorEl.value = post.author;
      if (wordCountEl) {
        wordCountEl.textContent = `${countWords(post.text)}/200 слів`;
      }
      const matched = users.find((u) => u.email === post.author);
      if (userSelectEl) userSelectEl.value = matched ? String(matched.id) : '';
      clearFieldErrors();
    } catch (err) {
      showNotice(noticeEl, 'error', getApiErrorMsg(err));
    } finally {
      toggleButtonLoader(btn, false);
    }
  }
});

// ─── Word count ───────────────────────────────────────────────────────────────

textEl.addEventListener('input', () => {
  const words = countWords(textEl.value);
  if (words > 200) {
    textEl.value = textEl.value.trim().split(/\s+/).filter(Boolean).slice(0, 200).join(' ');
  }
  if (wordCountEl)
    wordCountEl.textContent = `${countWords(textEl.value)}/200 слів`;
  validateField('text');
});

// ─── User select ──────────────────────────────────────────────────────────────

userSelectEl.addEventListener('change', () => {
  const u = users.find((x) => String(x.id) === userSelectEl.value);
  if (u) {
    authorEl.value = u.email;
    validateField('author');
  }
});

// ─── Inline validation on blur/change ─────────────────────────────────────────

titleEl.addEventListener('input', () => validateField('title'));
titleEl.addEventListener('blur', () => validateField('title'));
categoryEl.addEventListener('change', () => validateField('category'));
authorEl.addEventListener('input', () => validateField('author'));
authorEl.addEventListener('blur', () => validateField('author'));

// ─── Sort (click on column headers) ──────────────────────────────────────────

document.querySelectorAll<HTMLElement>('#postsTable th[data-sort]').forEach((th) => {
  th.style.cursor = 'pointer';
  th.addEventListener('click', () => {
    const field = th.dataset.sort!;
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'asc';
    }
    currentPage = 1;
    loadPosts();
  });
});

// ─── Pagination ───────────────────────────────────────────────────────────────

pageSelectEl?.addEventListener('change', () => {
  const p = Number(pageSelectEl.value);
  if (Number.isInteger(p) && p > 0) {
    currentPage = p;
    loadPosts();
  }
});

prevPageBtn?.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    loadPosts();
  }
});

nextPageBtn?.addEventListener('click', () => {
  if (currentPage < totalPages) {
    currentPage++;
    loadPosts();
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────

loadUsersAndCategories();
loadPosts();