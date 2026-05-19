import {
  clearAuthState,
  createPost,
  deletePost,
  getCategories,
  getCurrentUser,
  getPostById,
  getPosts,
  getUsers,
  login,
  logout,
  register,
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
  setFormEnabled,
  setListStatus,
  showFieldErrors,
  showNotice,
  toggleButtonLoader,
} from './ui.js';

const postsTableBody = document.querySelector<HTMLTableSectionElement>('#postsTable tbody')!;
const postForm = document.querySelector<HTMLFormElement>('#postForm')!;
const postIdEl = document.querySelector<HTMLInputElement>('#postId')!;
const titleEl = document.querySelector<HTMLInputElement>('#title')!;
const categoryEl = document.querySelector<HTMLSelectElement>('#category')!;
const textEl = document.querySelector<HTMLTextAreaElement>('#text')!;
const currentAuthorEl = document.querySelector<HTMLElement>('#currentAuthor')!;
const saveBtn = document.querySelector<HTMLButtonElement>('#saveBtn')!;
const clearBtn = document.querySelector<HTMLButtonElement>('#clearBtn')!;
const wordCountEl = document.querySelector<HTMLElement>('#wordCount')!;
const noticeEl = document.querySelector<HTMLElement>('#notice')!;
const sortDirectionIconEl = document.querySelector<HTMLElement>('#sortDirectionIcon');
const pageSelectEl = document.querySelector<HTMLSelectElement>('#pageSelect');
const paginationSummaryEl = document.querySelector<HTMLElement>('#paginationSummary');
const prevPageBtn = document.querySelector<HTMLButtonElement>('#prevPageBtn');
const nextPageBtn = document.querySelector<HTMLButtonElement>('#nextPageBtn');
const usersListEl = document.querySelector<HTMLUListElement>('#usersList')!;
const authNameEl = document.querySelector<HTMLInputElement>('#authName')!;
const authEmailEl = document.querySelector<HTMLInputElement>('#authEmail')!;
const authPasswordEl = document.querySelector<HTMLInputElement>('#authPassword')!;
const registerBtn = document.querySelector<HTMLButtonElement>('#registerBtn')!;
const loginBtn = document.querySelector<HTMLButtonElement>('#loginBtn')!;
const logoutBtn = document.querySelector<HTMLButtonElement>('#logoutBtn')!;
const authStatusEl = document.querySelector<HTMLElement>('#authStatus')!;
const loginFormBlockEl = document.querySelector<HTMLElement>('#loginFormBlock')!;
const logoutBlockEl = document.querySelector<HTMLElement>('#logoutBlock')!;
const registerBlockEl = document.querySelector<HTMLElement>('#registerBlock')!;
const protectedContentEl = document.querySelector<HTMLElement>('#protectedContent')!;

let posts: PostDto[] = [];
let users: UserDto[] = [];
let usersListStatus: 'idle' | 'loading' | 'error' | 'empty' = 'idle';
let usersListErrorMsg = '';
let categories: CategoryDto[] = [];
let currentPage = 1;
let totalPages = 1;
let totalItems = 0;
let sortField = 'createdAt';
let sortDirection: 'asc' | 'desc' = 'desc';
let currentEditingId: string | null = null;
let isFormReadOnly = false;

const PAGE_SIZE = 10;
const EMAIL_REGEX = /^(?=.{1,254}$)(?=.{1,64}@)(?!.*\.\.)[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])*(?:\.(?:com\.ua|com|ua))$/i;

function getCurrentAuthorEmail(): string {
  const user = getCurrentUser();
  return user?.email ?? '';
}

function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

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
    default:
      return true;
  }
}

function validateAll(): boolean {
  const results = ['title', 'category', 'text'].map(validateField);
  return results.every(Boolean);
}

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


function renderUsersList(): void {
  usersListEl.innerHTML = '';
  if (usersListStatus === 'loading') {
    const li = document.createElement('li');
    li.className = 'users-list-status';
    li.textContent = '⏳ Завантаження…';
    usersListEl.appendChild(li);
    return;
  }
  if (usersListStatus === 'error') {
    const li = document.createElement('li');
    li.className = 'users-list-status users-list-error';
    li.textContent = `❌ ${usersListErrorMsg || 'Помилка завантаження'}`;
    usersListEl.appendChild(li);
    return;
  }
  if (users.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'users-list-empty';
    empty.textContent = 'Юзерів поки немає';
    usersListEl.appendChild(empty);
    return;
  }
  users.forEach((u) => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = u.name;
    const span = document.createElement('span');
    span.textContent = u.email;
    li.appendChild(strong);
    li.appendChild(document.createTextNode(' '));
    li.appendChild(span);
    usersListEl.appendChild(li);
  });
}

async function loadUsers(): Promise<void> {
  usersListStatus = 'loading';
  usersListErrorMsg = '';
  renderUsersList();
  try {
    const usersResult = await getUsers();
    users = usersResult.items;
    usersListStatus = users.length === 0 ? 'empty' : 'idle';
    renderUsersList();
  } catch (err) {
    usersListStatus = 'error';
    usersListErrorMsg = getApiErrorMsg(err);
    renderUsersList();
    console.error('Failed to load users:', err);
  }
}

async function loadCategories(): Promise<void> {
  try {
    const catsResult = await getCategories();
    categories = catsResult.items;
    renderCategoryOptions(categoryEl, categories);
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

function resetForm(cancelEdit = true): void {
  postForm.reset();
  postIdEl.value = '';
  if (wordCountEl) wordCountEl.textContent = '0/200 слів';
  clearFieldErrors();
  if (cancelEdit) {
    currentEditingId = null;
    isFormReadOnly = false;
    setFormEnabled(postForm, true);
    saveBtn.disabled = false;
    clearBtn.disabled = false;
    currentAuthorEl.textContent = getCurrentAuthorEmail() || 'не авторизований';
  }
}

function refreshAuthStatus(): void {
  const user = getCurrentUser();
  if (!user) {
    authStatusEl.textContent = 'Ви не авторизовані';
    currentAuthorEl.textContent = 'не авторизований';
    loginFormBlockEl.hidden = false;
    registerBlockEl.hidden = false;
    logoutBlockEl.hidden = true;
    protectedContentEl.hidden = true;
    return;
  }
  authStatusEl.textContent = `Ви увійшли як: ${user.name} (${user.email})`;
  currentAuthorEl.textContent = user.email;
  loginFormBlockEl.hidden = true;
  registerBlockEl.hidden = true;
  logoutBlockEl.hidden = false;
  protectedContentEl.hidden = false;
}

window.addEventListener('auth-state-changed', () => {
  refreshAuthStatus();
});

function validateAuthField(field: 'name' | 'email' | 'password', isRegister: boolean): boolean {
  if (field === 'name') {
    if (!isRegister) {
      clearFieldError('authName');
      return true;
    }
    const value = authNameEl.value.trim();
    if (value.length < 2 || value.length > 50) {
      setFieldError('authName', "Ім'я має бути від 2 до 50 символів");
      return false;
    }
    clearFieldError('authName');
    return true;
  }

  if (field === 'email') {
    const value = authEmailEl.value.trim();
    if (!value) {
      setFieldError('authEmail', "Поле обов'язкове");
      return false;
    }
    if (!EMAIL_REGEX.test(value)) {
      setFieldError('authEmail', 'Невірний формат email');
      return false;
    }
    clearFieldError('authEmail');
    return true;
  }

  if (!authPasswordEl.value) {
    setFieldError('authPassword', "Поле обов'язкове");
    return false;
  }
  if (authPasswordEl.value.length < 8) {
    setFieldError('authPassword', 'Пароль має містити мінімум 8 символів');
    return false;
  }
  clearFieldError('authPassword');
  return true;
}

function validateAuthForm(isRegister: boolean): boolean {
  const nameOk = validateAuthField('name', isRegister);
  const emailOk = validateAuthField('email', isRegister);
  const passwordOk = validateAuthField('password', isRegister);
  return nameOk && emailOk && passwordOk;
}

function showAuthErrors(details: Array<{ field: string; message: string }>): void {
  details.forEach(({ field, message }) => {
    if (field === 'name') {
      setFieldError('authName', message);
      return;
    }
    if (field === 'email') {
      setFieldError('authEmail', message);
      return;
    }
    if (field === 'password') {
      setFieldError('authPassword', message);
    }
  });
}

saveBtn.addEventListener('click', async () => {
  clearFieldErrors();
  
  if (isFormReadOnly) {
    showNotice(noticeEl, 'error', 'Ви не можете редагувати чужий пост');
    return;
  }
  
  if (!validateAll()) return;

  const author = getCurrentAuthorEmail();
  if (!author) {
    showNotice(noticeEl, 'error', 'Спочатку виконайте вхід або реєстрацію');
    return;
  }

  const data: CreatePostDto = {
    title: titleEl.value.trim(),
    category: categoryEl.value,
    text: textEl.value.trim(),
    author,
  };

  toggleButtonLoader(saveBtn, true);
  setFormEnabled(postForm, false);
  try {
    if (currentEditingId) {
      await updatePost(currentEditingId, data);
      showNotice(noticeEl, 'success', 'Пост оновлено');
    } else {
      await createPost(data);
      showNotice(noticeEl, 'success', 'Пост створено');
    }
    await loadPosts();
    resetForm(true);
  } catch (err) {
    if (err instanceof ApiError && err.status === 400 && err.details.length > 0) {
      showFieldErrors(err.details);
    }
    showNotice(noticeEl, 'error', getApiErrorMsg(err));
  } finally {
    toggleButtonLoader(saveBtn, false);
    setFormEnabled(postForm, !isFormReadOnly);
    saveBtn.disabled = isFormReadOnly;
    clearBtn.disabled = false;
  }
});

registerBtn.addEventListener('click', async () => {
  clearFieldErrors();
  if (!validateAuthForm(true)) return;
  toggleButtonLoader(registerBtn, true);
  try {
    await register({
      name: authNameEl.value.trim(),
      email: authEmailEl.value.trim(),
      password: authPasswordEl.value,
    });
    refreshAuthStatus();
    await loadUsers();
    await loadCategories();
    await loadPosts();
    showNotice(noticeEl, 'success', 'Реєстрація успішна');
  } catch (err) {
    if (err instanceof ApiError && (err.status === 400 || err.status === 409) && err.details.length > 0) {
      showAuthErrors(err.details);
    }
    showNotice(noticeEl, 'error', getApiErrorMsg(err));
  } finally {
    toggleButtonLoader(registerBtn, false);
  }
});

loginBtn.addEventListener('click', async () => {
  clearFieldErrors();
  if (!validateAuthForm(false)) return;
  toggleButtonLoader(loginBtn, true);
  try {
    await login({
      email: authEmailEl.value.trim(),
      password: authPasswordEl.value,
    });
    refreshAuthStatus();
    await loadUsers();
    await loadCategories();
    await loadPosts();
    showNotice(noticeEl, 'success', 'Успішний вхід');
  } catch (err) {
    if (err instanceof ApiError && err.status === 400 && err.details.length > 0) {
      showAuthErrors(err.details);
    }
    showNotice(noticeEl, 'error', getApiErrorMsg(err));
  } finally {
    toggleButtonLoader(loginBtn, false);
  }
});

logoutBtn.addEventListener('click', async () => {
  toggleButtonLoader(logoutBtn, true);
  try {
    logout();
    clearAuthState();
    refreshAuthStatus();
    resetForm(true);
    showNotice(noticeEl, 'success', 'Ви вийшли з системи');
  } finally {
    toggleButtonLoader(logoutBtn, false);
  }
});

clearBtn.addEventListener('click', () => resetForm(true));

postsTableBody.addEventListener('click', async (e: Event) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (!id) return;

  if (action === 'delete') {
    toggleButtonLoader(btn, true);
    try {
     
      
      if (!confirm('Ви впевнені, що хочете видалити цей пост?')) return;
      
      await deletePost(id);
      showNotice(noticeEl, 'success', 'Пост видалено');
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
      const currentAuthor = getCurrentAuthorEmail();
      const isAuthor = post.author === currentAuthor;
      
      currentEditingId = post.id;
      isFormReadOnly = !isAuthor;
      currentAuthorEl.textContent = post.author;
      
      postIdEl.value = post.id;
      titleEl.value = post.title;
      categoryEl.value = post.category;
      textEl.value = post.text;
      if (wordCountEl) {
        wordCountEl.textContent = `${countWords(post.text)}/200 слів`;
      }
      clearFieldErrors();
      
      if (!isAuthor) {
        setFormEnabled(postForm, false);
        saveBtn.disabled = true;
        clearBtn.disabled = false;
      } else {
        setFormEnabled(postForm, true);
        saveBtn.disabled = false;
        clearBtn.disabled = false;
      }
    } catch (err) {
      showNotice(noticeEl, 'error', getApiErrorMsg(err));
    } finally {
      toggleButtonLoader(btn, false);
    }
  }
});

textEl.addEventListener('input', () => {
  const words = countWords(textEl.value);
  if (words > 200) {
    textEl.value = textEl.value.trim().split(/\s+/).filter(Boolean).slice(0, 200).join(' ');
  }
  if (wordCountEl) wordCountEl.textContent = `${countWords(textEl.value)}/200 слів`;
  validateField('text');
});

titleEl.addEventListener('input', () => validateField('title'));
titleEl.addEventListener('blur', () => validateField('title'));
categoryEl.addEventListener('change', () => validateField('category'));
authNameEl.addEventListener('input', () => validateAuthField('name', true));
authNameEl.addEventListener('blur', () => validateAuthField('name', true));
authEmailEl.addEventListener('input', () => validateAuthField('email', true));
authEmailEl.addEventListener('blur', () => validateAuthField('email', true));
authPasswordEl.addEventListener('input', () => validateAuthField('password', true));
authPasswordEl.addEventListener('blur', () => validateAuthField('password', true));

document.querySelectorAll<HTMLElement>('#postsTable th[data-sort]').forEach((th) => {
  th.style.cursor = 'pointer';
  th.addEventListener('click', () => {
    const field = th.dataset.sort;
    if (!field) return;
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

refreshAuthStatus();
if (getCurrentUser()) {
  loadUsers();
  loadCategories();
  loadPosts();
}
