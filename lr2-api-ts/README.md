# TypeScript REST API - Post Management System

Повнофункціональний REST API для управління постами, користувачами та категоріями, написаний на **TypeScript** з Express.js.

## Як запустити

### 1. Встановлення залежностей
```bash
npm install
```

### 2. Розробка з live reload
```bash
npm run dev
```
Сервер запуститься на `http://localhost:3000`

### 3. Build для продакшену
```bash
npm run build
npm start
```

### 4. Перевірка коду (ESLint)
```bash
npm run lint
```

---

## API Endpoints

###  Здоров'я сервісу
```bash
curl http://localhost:3000/api/health
```

**Успішна відповідь (200):**
```json
{ "ok": true }
```

---

###  Користувачі (Users)

#### Список користувачів
```bash
curl http://localhost:3000/api/users
```

**Відповідь (200):**
```json
{
  "items": [
    { "id": 1, "name": "John Doe", "email": "john@example.com" },
    { "id": 2, "name": "Jane Smith", "email": "jane@example.com" }
  ],
  "total": 2
}
```

#### Отримати користувача за ID
```bash
curl http://localhost:3000/api/users/1
```

**Відповідь (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com"
}
```

#### Створити користувача
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com"
  }'
```

**Успішна відповідь (201):**
```json
{
  "id": 3,
  "name": "Alice Johnson",
  "email": "alice@example.com"
}
```

**Помилка валідації (400):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      { "field": "name", "message": "name is required and must be 2-50 characters" },
      { "field": "email", "message": "email must be a valid email address" }
    ]
  }
}
```

#### Оновити користувача
```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "email": "john.updated@example.com"
  }'
```

**Відповідь (200):**
```json
{
  "id": 1,
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

#### Видалити користувача
```bash
curl -X DELETE http://localhost:3000/api/users/1
```

**Успішна відповідь (204):** Без тіла

**Помилка - користувач не знайдений (404):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found",
    "details": []
  }
}
```

---

###  Пости (Posts)

#### Список постів
```bash
# Всі пості
curl http://localhost:3000/api/posts

# З фільтром по категорії
curl "http://localhost:3000/api/posts?category=News"

# З пошуком
curl "http://localhost:3000/api/posts?q=TypeScript"

# З сортуванням
curl "http://localhost:3000/api/posts?sortBy=createdAt&sortOrder=desc"

# Комбіноване
curl "http://localhost:3000/api/posts?category=Tutorial&sortBy=title&sortOrder=asc"
```

**Відповідь (200):**
```json
{
  "items": [
    {
      "id": "post-1",
      "title": "Getting Started with TypeScript",
      "category": "Tutorial",
      "text": "TypeScript is a typed superset of JavaScript...",
      "author": "john@example.com",
      "userId": 1,
      "createdAt": "2026-03-25T10:30:00Z",
      "updatedAt": "2026-03-26T14:15:00Z"
    }
  ],
  "total": 1
}
```

#### Отримати пост за ID
```bash
curl http://localhost:3000/api/posts/post-1
```

**Відповідь (200):**
```json
{
  "id": "post-1",
  "title": "Getting Started with TypeScript",
  "category": "Tutorial",
  "text": "TypeScript is a typed superset of JavaScript...",
  "author": "john@example.com",
  "userId": 1,
  "createdAt": "2026-03-25T10:30:00Z"
}
```

#### Створити пост
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Advanced TypeScript Patterns",
    "category": "Tutorial",
    "text": "In this post we will explore advanced patterns and techniques in TypeScript.",
    "author": "alice@example.com",
    "userId": 3
  }'
```

**Успішна відповідь (201):**
```json
{
  "id": "post-2",
  "title": "Advanced TypeScript Patterns",
  "category": "Tutorial",
  "text": "In this post we will explore advanced patterns and techniques in TypeScript.",
  "author": "alice@example.com",
  "userId": 3,
  "createdAt": "2026-03-26T15:00:00Z"
}
```

**Помилка валідації - текст занадто довгий (400):**
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "category": "News",
    "text": "word word word ... (більше 200 слів) ...",
    "author": "test@example.com",
    "userId": 1
  }'
```

**Відповідь:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      { "field": "text", "message": "text is required and must be 1-200 words" }
    ]
  }
}
```

#### Оновити пост
```bash
curl -X PUT http://localhost:3000/api/posts/post-1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "TypeScript Updated",
    "category": "News"
  }'
```

**Відповідь (200):**
```json
{
  "id": "post-1",
  "title": "TypeScript Updated",
  "category": "News",
  "text": "TypeScript is a typed superset of JavaScript...",
  "author": "john@example.com",
  "userId": 1,
  "createdAt": "2026-03-25T10:30:00Z",
  "updatedAt": "2026-03-26T16:00:00Z"
}
```

#### Видалити пост
```bash
curl -X DELETE http://localhost:3000/api/posts/post-1
```

**Успішна відповідь (204):** Без тіла

---

###  Категорії (Categories)

#### Список категорій
```bash
curl http://localhost:3000/api/categories
```

**Відповідь (200):**
```json
{
  "items": ["News", "Tutorial", "Opinion", "Announcement"],
  "total": 4
}
```

---

##  Сценарії тестування для захисту

### Сценарій 1: Валідація обов'язкових полів
```bash
# Користувач без email
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User"}'

# Пост з неверною категорією
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "category": "InvalidCategory",
    "text": "Some text",
    "author": "test@example.com",
    "userId": null
  }'
```

### Сценарій 2: Узгоджена структура помилок
```bash
# Перевіка, що ВСІ помилки мають однакову структуру:
# { error: { code, message, details: [{ field, message }] } }

curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "X", "email": "not-an-email"}'
```

### Сценарій 3: HTTP статуси
```bash
# 201 Created
curl -i -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "New User", "email": "new@example.com"}'

# 204 No Content
curl -i -X DELETE http://localhost:3000/api/users/1

# 404 Not Found
curl -i http://localhost:3000/api/users/99999

# 400 Bad Request
curl -i -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "A"}'

# 500 Internal Error (маловероятно - API добре оброблює помилки)
```

---

##  Архітектура проекту

```
src/
├── index.ts              # Точка входу, middleware pipeline
├── app-error.ts          # Клас AppError для структурованих помилок
├── types.ts              # Всі TypeScript типи та DTOs
├── errors.ts             # Helper функції для помилок
├── mappers.ts            # DTO трансформації
├── store.ts              # In-memory сховище
├── controllers/          # HTTP обробники (責任: HTTP status + routing)
│   ├── users.controller.ts
│   ├── posts.controller.ts
│   └── categories.controller.ts
├── services/             # Бізнес-логіка
│   ├── users.service.ts
│   ├── posts.service.ts
│   └── categories.service.ts
├── repositories/         # Доступ до даних
│   ├── users.repository.ts
│   ├── posts.repository.ts
│   └── categories.repository.ts
├── routes/               # Express маршрути
│   ├── users.router.ts
│   ├── posts.router.ts
│   └── categories.router.ts
├── middleware/           # Express middleware
│   ├── logger.ts         # Логування запитів
│   └── errorHandler.ts   # Обробка помилок
├── dtos/                 # DTO валідаторы
│   ├── user.schemas.ts
│   └── post.schemas.ts
└── utils/
    └── validators.ts     # Вспомогательні функції валідації
```

---

##  Особливості

- ✅ **TypeScript strict mode** - типобезпечність на максимумі
- ✅ **Узгоджені контракти** - помилки і успіхи однаково структуровані
- ✅ **Middleware pipeline** - Logger → Routes → Error Handler
- ✅ **Валідація DTOs** - окремо від контролерів
- ✅ **AppError клас** - структурована обробка помилок
- ✅ **CORS-ready** - підтримка кросс-доменних запитів
- ✅ **ESLint** - перевірка коду якості

---

##  Залежності

- **express** - веб-фреймворк
- **cors** - обробка CORS запитів
- **typescript** - типізація JavaScript

### Dev Dependencies
- **tsx** - запуск TypeScript без компіляції
- **@types/express** - типи для Express
- **eslint** - аналіз коду

---

##  Важливі типи

```typescript
// Успішна відповідь (список)
ListResponse<T> = { items: T[]; total: number }

// Помилка
ErrorResponse = {
  error: {
    code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR'
    message: string
    details: { field: string; message: string }[]
  }
}
```

---

##  Контрольний список для захисту

- [ ] Запустити `npm install`
- [ ] Запустити `npm run dev`
- [ ] Протестувати curl сценарії з цього README
- [ ] Перевірити структуру помилок (400, 404, 500)
- [ ] Запустити `npm run lint` без помилок
- [ ] Запустити `npm run build` без помилок
