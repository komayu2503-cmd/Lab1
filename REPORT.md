# Лабораторна робота №5: Уразливості і захист

## Мета роботи
Сформувати вміння виявляти та відтворювати типові уразливості вебзастосунків, виконувати виправлення на рівні коду та конфігурації, а також перевіряти ефективність захисту.

## Реалізовані сценарії

### Сценарій A: SQL Injection (SQLi)

#### Проблема (було)
Користувацький ввід потрапляв до SQL-запиту через конкатенацію рядків:

```typescript
// НЕБЕЗПЕЧНО - користувацький ввід впливає на SQL структуру
export function buildWhereClause(query: PostListQuery): string {
  const conditions: string[] = [];

  if (query.q) {
    const normalizedQuery = query.q.trim().toLowerCase();
    conditions.push(`(
      lower(p.title) LIKE ${sqlString(`%${normalizedQuery}%`)} OR
      lower(c.name) LIKE ${sqlString(`%${normalizedQuery}%`)} OR
      lower(p.text) LIKE ${sqlString(`%${normalizedQuery}%`)} OR
      lower(p.author) LIKE ${sqlString(`%${normalizedQuery}%`)}
    )`);
  }
  // ...
}
```

Функція `sqlString()` лише екранує лапки (заміна `'` на `''`), але це НЕ параметризація:
- Неправильно обчисляється при з'єднаних рядках
- Можна обійти через UNICODE-символи, пробільні символи тощо

#### Відтворення вразливості
```bash
# До виправлення - пошук з небезпечним вводом
curl "http://localhost:3000/api/v1/posts?search=test' OR '1'='1"

# Результат: небезпечний SQL, може повернути більше даних ніж потрібно
```

#### Виправлення
Замінила конкатенацію на параметризовані запити:

```typescript
// БЕЗПЕЧНО - користувацький ввід передається як дані, не як код
function buildWhereClause(query: PostListQuery): { sql: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.q) {
    const normalizedQuery = query.q.trim().toLowerCase();
    const searchParam = `%${normalizedQuery}%`;
    conditions.push(`(
      lower(p.title) LIKE ? OR
      lower(c.name) LIKE ? OR
      lower(p.text) LIKE ? OR
      lower(p.author) LIKE ?
    )`);
    params.push(searchParam, searchParam, searchParam, searchParam);
  }
  
  const sql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { sql, params };
}
```

Оновлені функції БД для підтримки параметрів:

```typescript
// src/db/client.ts
export function run(sql: string, params?: unknown[]): { changes: number; lastInsertRowid: number } {
  const stmt = ensureDatabase().prepare(sql);
  const result = params ? stmt.run(...params) : stmt.run();
  return { changes: result.changes, lastInsertRowid: Number(result.lastInsertRowid) };
}

export function get<T>(sql: string, params?: unknown[]): T | undefined {
  const stmt = ensureDatabase().prepare(sql);
  return (params ? stmt.get(...params) : stmt.get()) as T | undefined;
}
```

Оновлені репозиторії для використання параметрів:

```typescript
// Приклад: posts.repository.ts - getById
getById(id: string): Post | undefined {
  const row = get<PostRow>(
    `
    SELECT
      p.id, p.title, c.name AS category, p.categoryId, p.text,
      p.author, p.userId, p.createdAt, p.updatedAt
    FROM posts p
    JOIN categories c ON c.id = p.categoryId
    WHERE p.id = ?;  // Параметр замість конкатенації
    `,
    [id]  // Дані передаються окремо
  );
  return row ? mapRow(row) : undefined;
}
```

#### Перевірка виправлення
```bash
# Після виправлення - той самий небезпечний ввід більше не впливає на запит
curl "http://localhost:3000/api/v1/posts?search=test' OR '1'='1"

# Результат: повертає пусто (пошук літерального рядка "test' OR '1'='1")
# Или коректні результати пошуку

# Звичайний пошук працює як раніше
curl "http://localhost:3000/api/v1/posts?search=TypeScript"
# Результат: повертає пости з "TypeScript" у назві/тексті/авторі
```

---

### Сценарій B: XSS (Cross-Site Scripting)

#### Проблема (було)
Дані користувача вставлялися в DOM через `innerHTML`, що дозволяло вводити HTML/JavaScript:

```typescript
// НЕБЕЗПЕЧНО - innerHTML інтерпретує дані як розмітку
export function renderPosts(tbodyEl: HTMLTableSectionElement, posts: PostDto[]): void {
  posts.forEach((post) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(post.title)}</td>
      <td>${escapeHtml(post.author)}</td>
      <td>
        <button data-id="${escapeHtml(post.id)}">...</button>
      </td>
    `;
    tbodyEl.appendChild(tr);
  });
}
```

Хоча тут використовується `escapeHtml()`, використання `innerHTML` все ще небезпечно:
- Можливі обхідні маневри з іншими контекстами
- Ризик при помилках в коді

#### Відтворення вразливості
```javascript
// Ввести в поле "Title" під час створення поста:
<img src=x onerror="alert('XSS')">

// Результат (до виправлення): alert виконується коли пост відображується
```

#### Виправлення
Замінив `innerHTML` на DOM API з `textContent`:

```typescript
// БЕЗПЕЧНО - textContent не інтерпретує дані як HTML
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

    // Клітинка 1: Title
    const tdTitle = document.createElement('td');
    tdTitle.textContent = post.title;  // textContent безпечна
    tr.appendChild(tdTitle);

    // Клітинка 2: Category
    const tdCategory = document.createElement('td');
    tdCategory.textContent = post.category;
    tr.appendChild(tdCategory);

    // ... інші клітинки ...
    
    tbodyEl.appendChild(tr);
  });
}
```

Аналогічно оновлена функція `setListStatus`:

```typescript
// НЕБЕЗПЕЧНО
tbodyEl.innerHTML = `<tr><td>${escapeHtml(message)}</td></tr>`;

// БЕЗПЕЧНО
const tr = document.createElement('tr');
const td = document.createElement('td');
td.textContent = message;  // textContent не інтерпретує HTML
tr.appendChild(td);
tbodyEl.appendChild(tr);
```

#### Перевірка виправлення
```html
<!-- Ввести в поле Title під час створення поста: -->
<img src=x onerror="alert('XSS')">

<!-- Результат (після виправлення): -->
<!-- Текст відображується як-є, без виконання скрипту -->
<!-- На сторінці видно: <img src=x onerror="alert('XSS')"> -->
```

---

### Сценарій C: Broken Access Control / IDOR

#### Проблема (було)
Будь-який користувач міг отримати/змінити/видалити чужий пост просто змінивши `id` у запиті:

```bash
# Користувач A видалив пост користувача B
curl -X DELETE "http://localhost:3000/api/v1/posts/post-2"
# Успіх (200) - пост видалений, навіть якщо він не належить користувачу A
```

Немало було:
- Автентифікації користувача (X-Demo-UserId заголовок)
- Перевірки прав доступу на бекенді

#### Відтворення вразливості
```bash
# Користувач 1 створює пост з userId=1
curl -X POST "http://localhost:3000/api/v1/posts" \
  -H "X-Demo-UserId: 1" \
  -H "Content-Type: application/json" \
  -d '{"title":"Пост №1","category":"News","text":"...","author":"user1@example.com"}'

# Користувач 2 мав доступ до чужого поста (IDOR - до виправлення)
curl -X GET "http://localhost:3000/api/v1/posts/post-123" \
  -H "X-Demo-UserId: 2"
# Результат: успіх (200) - чужий пост видимий

# Користувач 2 міг змінити чужий пост
curl -X PUT "http://localhost:3000/api/v1/posts/post-123" \
  -H "X-Demo-UserId: 2" \
  -H "Content-Type: application/json" \
  -d '{"title":"ХАКЕРСЬКИЙ ПОСТ",...}'
# Результат: успіх (200) - пост змінено, хоча він не його
```

#### Виправлення

**1. Додав middleware для демо-автентифікації:**

```typescript
// src/middleware/demoAuth.ts
export function demoAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = req.header("X-Demo-UserId");

  if (!userId) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Missing X-Demo-UserId header", details: [] }
    });
    return;
  }

  const id = Number(userId);
  if (Number.isNaN(id)) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Invalid X-Demo-UserId format", details: [] }
    });
    return;
  }

  // Перевірка, що користувач існує
  const user = usersRepository.getById(id);
  if (!user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "User not found", details: [] }
    });
    return;
  }

  req.user = { id: user.id };
  next();
}
```

**2. Додала перевірку прав доступу в сервіс:**

```typescript
// src/services/posts.service.ts
update(id: string, input: unknown, currentUserId: number): PostDto {
  const post = postsRepository.getById(id);

  if (!post) {
    throw errNotFound('Post not found');
  }

  // IDOR PROTECTION: Тільки власник може змінити свій пост
  if (post.userId !== null && post.userId !== currentUserId) {
    throw errForbidden('Access denied: you can only update your own posts');
  }

  // ... решта кода ...
}

delete(id: string, currentUserId: number): void {
  const post = postsRepository.getById(id);

  if (!post) {
    throw errNotFound('Post not found');
  }

  // IDOR PROTECTION: Тільки власник може видалити свій пост
  if (post.userId !== null && post.userId !== currentUserId) {
    throw errForbidden('Access denied: you can only delete your own posts');
  }

  if (!postsRepository.delete(id)) {
    throw errNotFound('Post not found');
  }
}
```

**3. Додав middleware до маршрутів, що змінюють дані:**

```typescript
// src/routes/posts.router.ts
postsRouter.post('/', authOrDemo, postsController.create);
postsRouter.put('/:id', authOrDemo, postsController.update);
postsRouter.delete('/:id', authOrDemo, postsController.delete);
```

**4. Контролер передає userId сервісу:**

```typescript
// src/controllers/posts.controller.ts
update(req: Request, res: Response, next: NextFunction): void {
  try {
    const postId = String(req.params.id);
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      res.status(401).json({ 
        error: { code: "UNAUTHORIZED", message: "User not authenticated" } 
      });
      return;
    }
    res.status(200).json(postsService.update(postId, req.body, currentUserId));
  } catch (error) {
    next(error);
  }
}
```

#### Перевірка виправлення
```bash
# Користувач 1 створює пост
curl -X POST "http://localhost:3000/api/v1/posts" \
  -H "X-Demo-UserId: 1" \
  -H "Content-Type: application/json" \
  -d '{"title":"Мій пост","category":"News","text":"Контент","author":"user1@example.com"}'
# Результат: {"id":"post-123",...}

# Користувач 1 може змінити свій пост (успіх)
curl -X PUT "http://localhost:3000/api/v1/posts/post-123" \
  -H "X-Demo-UserId: 1" \
  -H "Content-Type: application/json" \
  -d '{"title":"Оновлений пост",...}'
# Результат: 200 OK

# Користувач 2 ТЕПЕР ПРИХОВАНИЙ доступ до чужого поста
curl -X PUT "http://localhost:3000/api/v1/posts/post-123" \
  -H "X-Demo-UserId: 2" \
  -H "Content-Type: application/json" \
  -d '{"title":"ХАКЕРСЬКИЙ ПОСТ",...}'
# Результат: 403 Forbidden - {"error":{"code":"FORBIDDEN","message":"Access denied: you can only update your own posts"}}

# Користувач 2 не може видалити чужий пост
curl -X DELETE "http://localhost:3000/api/v1/posts/post-123" \
  -H "X-Demo-UserId: 2"
# Результат: 403 Forbidden
```

### Bonus: Реальна JWT-автентифікація

Додано повноцінну auth-схему:

1. `POST /api/v1/auth/register` - реєстрація (bcrypt-хеш пароля + JWT).
2. `POST /api/v1/auth/login` - логін (перевірка `bcrypt.compare` + JWT на 24h).
3. middleware `jwtAuth` читає `Authorization: Bearer <token>`.
4. rate limiting через `express-rate-limit`:
   - register: `5` спроб / `15` хв
   - login: `10` спроб / `15` хв
5. На фронтенді додана форма Login/Register та збереження токена у `localStorage`.

Приклад перевірки:

```bash
# Реєстрація
curl -X POST "http://localhost:3000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test.user@example.com","password":"password123"}'

# Логін
curl -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test.user@example.com","password":"password123"}'

# Доступ до posts/users-сценаріїв через JWT
curl "http://localhost:3000/api/v1/posts" \
  -H "Authorization: Bearer <token>"
```

#### Перевірка rate limiting

Щоб перевірити rate limiting, кілька разів поспіль надішли однаковий запит на `login` або `register`. Після перевищення ліміту сервер має повернути `429 Too Many Requests`.

```powershell
# Login: ліміт 10 спроб за 15 хвилин
1..12 | ForEach-Object {
  curl.exe -i -X POST "http://localhost:3000/api/v1/auth/login" `
    -H "Content-Type: application/json" `
    -d '{"email":"test.user@example.com","password":"wrongpass"}'
}
```

Очікувана поведінка:

- перші запити повертають звичайну помилку логіну, наприклад `401 Unauthorized`
- після вичерпання ліміту сервер повертає `429 Too Many Requests`
- у відповіді буде код `TOO_MANY_REQUESTS` і повідомлення на кшталт `Too many login attempts, try later`

Для `register` принцип той самий, але ліміт менший: `5` спроб за `15` хвилин.

### Сценарій D: Security Misconfiguration

#### Проблема (було)
- Помилки розкривають dev-деталі (stack trace)
- Немає базових безпечних заголовків
- Небезпечна конфігурація CORS

#### Виправлення

**1. Додав безпечні заголовки:**

```typescript
// src/middleware/securityHeaders.ts
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
}

// src/index.ts
app.use(securityHeaders);
```

**2. Приховав dev-деталі в помилках:**

```typescript
// src/middleware/errorHandler.ts - РАНІШЕ
console.error(err);
res.status(500).json({
  error: { code: 'INTERNAL_ERROR', message: 'Internal server error', details: [] }
});

// ТЕПЕР - Не розкривати деталі в production
const isDev = process.env.NODE_ENV === 'development';
console.error('[INTERNAL_ERROR]', err);  // логування для адміна
res.status(500).json({
  error: { 
    code: 'INTERNAL_ERROR', 
    message: 'Internal server error',
    ...(isDev && { details: String(err.message ?? err) })  // Тільки в dev
  }
});
```

**3. Оновив CORS для підтримки X-Demo-UserId:**

```typescript
// src/index.ts
const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Demo-UserId'],
  credentials: true,
};
```

#### Перевірка виправлення
```bash
# Перевірити безпечні заголовки
curl -I "http://localhost:3000/api/v1/posts"

# Результат:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Referrer-Policy: no-referrer
```

---

## Таблиця: Ризик → Наслідок → Виправлення

| Вразливість | Ризик | Наслідок до виправлення | Виправлення |
|---|---|---|---|
| **SQL Injection** | Користувач вводить `' OR '1'='1` у пошук | Повертаються всі пости замість результатів пошуку; витік даних | Параметризовані запити (`?` параметри замість конкатенації) |
| **XSS** | Користувач вводить `<img onerror="alert('xss')">` у Title | Скрипт виконується в браузері; крадіжка cookies/токенів | textContent + DOM API замість innerHTML |
| **IDOR** | Користувач змінює `id` в URL на чужий або підставляє чужий `userId` під час write | Доступ до/зміна/видалення чужих даних | Читання постів публічне, а write-операції звіряють власника на бекенді |
| **Misconfiguration** | Помилка розкриває stack trace | Інформація про структуру проекту; напад це можна спростити | Приховування dev-деталей; безпечні заголовки; узгоджені коди помилок |

---

## Тестування

### Як запустити проект локально
```bash
# Backend
cd lr2-api-ts
npm install
npm run seed    # Заповнити БД тестовими даними
npm run dev     # Запустити на http://localhost:3000

# Frontend (в іншому терміналі)
npm install
npm run build
# Відкрити через Live Server на http://localhost:5500
```

### Команди для перевірки (Postman/curl)
```bash
# 1. Список користувачів (для отримання userId)
curl "http://localhost:3000/api/v1/users"

# 2. Створити пост (потребує X-Demo-UserId)
curl -X POST "http://localhost:3000/api/v1/posts" \
  -H "X-Demo-UserId: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Post",
    "category": "News",
    "text": "Test content",
    "author": "test@example.com"
  }'

# 3. Пошук (перевірка SQLi захисту)
curl "http://localhost:3000/api/v1/posts?search=test' OR '1'='1"

# 4. Спроба змінити чужий пост або підставити чужий userId (перевірка IDOR)
curl -X PUT "http://localhost:3000/api/v1/posts/{post-id}" \
  -H "X-Demo-UserId: 2" \
  -H "Content-Type: application/json" \
  -d '{"title":"Hacked"}'
# Результат: 403 Forbidden
```

---

## Висновки

У цій лабораторній роботі успішно реалізовано захист від чотирьох головних типів уразливостей:

1. **SQL Injection** - Параметризовані запити (prepared statements)
2. **XSS** - DOM API з textContent замість innerHTML
3. **IDOR** - Публічне читання постів і серверна перевірка write-операцій
4. **Misconfiguration** - Безпечні заголовки та приховування dev-деталей

Всі виправлення зроблені дотримуючись принципу "trust but verify" - безпека забезпечена на бекенді, де користувач не може її обійти.
