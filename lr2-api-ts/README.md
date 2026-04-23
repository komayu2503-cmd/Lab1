# TypeScript REST API with SQLite

REST API для керування користувачами, постами та категоріями на TypeScript, Express і SQLite.

## Запуск

### 1. Встановлення залежностей

```bash
npm install
```

### 2. Ініціалізація бази та тестових даних

```bash
npm run seed
```

Після цього буде створено локальний файл бази даних:

- `./data/app.db`

Файл БД не потрапляє в репозиторій, тому що папка `data/` додана в `.gitignore`.

### 3. Запуск у режимі розробки

```bash
npm run dev
```

Сервер стартує на `http://localhost:3000`.

### 4. Build і запуск з `dist`

```bash
npm run build
npm start
```

### 5. Перевірка коду

```bash
npm run lint
npm run build
```

## Змінні середовища

Файл `.env`:

```env
PORT=3000
NODE_ENV=development
DB_PATH=./data/app.db
```

## Як ініціалізується БД

До `app.listen(...)` викликається `initDb()`.

`initDb()`:

- відкриває SQLite-з'єднання;
- вмикає `PRAGMA foreign_keys = ON`;
- створює таблицю `schema_migrations`;
- застосовує SQL-міграції з `src/db/migrations.ts`;
- логуює `Applied migration: ...` і `DB schema initialized`.

## Схема БД

Проєкт використовує 3 основні таблиці.

### `users`

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `name TEXT NOT NULL`
- `email TEXT NOT NULL UNIQUE`
- `createdAt TEXT NOT NULL`
- `updatedAt TEXT`

Обмеження:

- `NOT NULL`
- `UNIQUE(email)`
- `CHECK(length(trim(name)) BETWEEN 2 AND 50)`

### `categories`

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `name TEXT NOT NULL UNIQUE`
- `createdAt TEXT NOT NULL`
- `updatedAt TEXT`

Обмеження:

- `NOT NULL`
- `UNIQUE(name)`
- `CHECK(length(trim(name)) BETWEEN 2 AND 50)`

### `posts`

- `id TEXT PRIMARY KEY`
- `title TEXT NOT NULL`
- `categoryId INTEGER NOT NULL`
- `text TEXT NOT NULL`
- `author TEXT NOT NULL`
- `userId INTEGER`
- `createdAt TEXT NOT NULL`
- `updatedAt TEXT`

Зв'язки:

- `posts.categoryId -> categories.id ON DELETE RESTRICT`
- `posts.userId -> users.id ON DELETE SET NULL`

Обмеження:

- `NOT NULL`
- `FOREIGN KEY`
- `CHECK(length(trim(title)) BETWEEN 3 AND 120)`
- `CHECK(length(trim(text)) > 0)`
- `CHECK(author LIKE '%@%.%')`

## API Endpoints

### Health

```bash
curl http://localhost:3000/api/health
```

### Users

```bash
curl http://localhost:3000/api/users
curl http://localhost:3000/api/users/1
curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"name":"Alice","email":"alice@example.com"}'
curl -X PUT http://localhost:3000/api/users/1 -H "Content-Type: application/json" -d '{"name":"Alice Updated","email":"alice.updated@example.com"}'
curl -X DELETE http://localhost:3000/api/users/1
```

### Categories

```bash
curl http://localhost:3000/api/categories
curl http://localhost:3000/api/categories/1
curl -X POST http://localhost:3000/api/categories -H "Content-Type: application/json" -d '{"name":"Guides"}'
curl -X PUT http://localhost:3000/api/categories/1 -H "Content-Type: application/json" -d '{"name":"News Updated"}'
curl -X DELETE http://localhost:3000/api/categories/1
```

### Posts

```bash
curl http://localhost:3000/api/posts
curl http://localhost:3000/api/posts/post-1
curl -X POST http://localhost:3000/api/posts -H "Content-Type: application/json" -d '{"title":"Advanced TypeScript Patterns","category":"Tutorial","text":"In this post we will explore advanced patterns in TypeScript.","author":"alice@example.com","userId":1}'
curl -X PUT http://localhost:3000/api/posts/post-1 -H "Content-Type: application/json" -d '{"title":"TypeScript Updated","category":"News"}'
curl -X DELETE http://localhost:3000/api/posts/post-1
```

## Приклад з WHERE + ORDER + LIMIT

```bash
curl "http://localhost:3000/api/posts?userId=1&sortBy=createdAt&sortOrder=desc&limit=5"
```

У цьому запиті використовується:

- `WHERE p.userId = 1`
- `ORDER BY p.createdAt DESC`
- `LIMIT 5 OFFSET 0` — обмеження кількості рядків у самому SQL-запиті

## Агрегаційний ендпойнт

```bash
curl http://localhost:3000/api/posts/stats
```

Повертає COUNT постів по кожній категорії та дату останнього поста:

```json
[
  { "category": "Tutorial", "postCount": 3, "latestPost": "2026-04-20T10:00:00.000Z" },
  { "category": "News",     "postCount": 1, "latestPost": "2026-04-18T09:00:00.000Z" },
  { "category": "Opinion",  "postCount": 0, "latestPost": null }
]
```

SQL використовує `LEFT JOIN` + `COUNT` + `MAX` + `GROUP BY`.

## Індекси БД (міграція `002_add_indexes`)

| Індекс | Колонка | Навіщо |
|--------|---------|--------|
| `idx_posts_category_id` | `posts.categoryId` | прискорює JOIN з `categories` та фільтрацію `?category=` |
| `idx_posts_created_at`  | `posts.createdAt DESC` | прискорює сортування за датою (найпоширеніше) |
| `idx_posts_author`      | `posts.author` | прискорює фільтрацію `?author=` |

## Транзакція при видаленні користувача

`DELETE /api/users/:id` виконує в одній транзакції:

1. `UPDATE posts SET userId = NULL WHERE userId = :id` — відв'язує пости від юзера;
2. `DELETE FROM users WHERE id = :id` — видаляє самого юзера.

Якщо один з кроків падає — обидва відкочуються. Це гарантує узгодженість даних без розсинхронізації.

## Приклади відповідей

### Успішне створення користувача `201`

```json
{
  "id": 4,
  "name": "Alice",
  "email": "alice@example.com"
}
```

### Помилка валідації `400`

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "name",
        "message": "name is required and must be 2-50 characters"
      }
    ]
  }
}
```

### Не знайдено `404`

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found",
    "details": []
  }
}
```

### Конфлікт `409`

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Email already exists",
    "details": [
      {
        "field": "email",
        "message": "email already exists"
      }
    ]
  }
}
```

## Що показати на захисті

Рекомендований порядок демонстрації:

1. `npm run seed`
2. `npm run dev`
3. `GET /api/users`, `GET /api/categories`, `GET /api/posts`
4. успішний `POST`
5. помилковий `POST` з `400`
6. `GET` по неіснуючому id з `404`
7. дубльований `email` або `category name` з `409`
8. запит з фільтрацією, сортуванням і `limit`
9. показати, що після перезапуску дані не зникають, бо лежать у SQLite

## Структура важливих файлів

```text
src/
  db/
    client.ts
    initDb.ts
    migrations.ts
    seed.ts
  controllers/
  repositories/
  routes/
  services/
```

## Перевірено

- `npm run build`
- `npm run seed`
