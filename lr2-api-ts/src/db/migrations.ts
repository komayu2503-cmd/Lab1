export type Migration = {
  name: string;
  sql: string;
};

export const migrations: Migration[] = [
  {
    name: '001_create_users_categories_posts',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 2 AND 50),
        email TEXT NOT NULL UNIQUE,
        createdAt TEXT NOT NULL,
        updatedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE CHECK(length(trim(name)) BETWEEN 2 AND 50),
        createdAt TEXT NOT NULL,
        updatedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 3 AND 120),
        categoryId INTEGER NOT NULL,
        text TEXT NOT NULL CHECK(length(trim(text)) > 0),
        author TEXT NOT NULL CHECK(author LIKE '%@%.%'),
        userId INTEGER,
        createdAt TEXT NOT NULL,
        updatedAt TEXT,
        FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE RESTRICT,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
      );
    `
  }
];