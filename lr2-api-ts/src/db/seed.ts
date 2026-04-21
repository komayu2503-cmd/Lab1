import { initDb } from "./initDb.js";
import { run, sqlNullableNumber, sqlString } from "./client.js";

function seedUsers(): void {
  const now = new Date().toISOString();

  run(`
    INSERT OR IGNORE INTO users (name, email, createdAt)
    VALUES ('Alice', 'alice@example.com', ${sqlString(now)});
  `);
  run(`
    INSERT OR IGNORE INTO users (name, email, createdAt)
    VALUES ('Bob', 'bob@example.com', ${sqlString(now)});
  `);
  run(`
    INSERT OR IGNORE INTO users (name, email, createdAt)
    VALUES ('Charlie', 'charlie@example.com', ${sqlString(now)});
  `);
}

function seedCategories(): void {
  const now = new Date().toISOString();

  run(`
    INSERT OR IGNORE INTO categories (name, createdAt)
    VALUES ('News', ${sqlString(now)});
  `);
  run(`
    INSERT OR IGNORE INTO categories (name, createdAt)
    VALUES ('Tutorial', ${sqlString(now)});
  `);
  run(`
    INSERT OR IGNORE INTO categories (name, createdAt)
    VALUES ('Opinion', ${sqlString(now)});
  `);
  run(`
    INSERT OR IGNORE INTO categories (name, createdAt)
    VALUES ('Announcement', ${sqlString(now)});
  `);
}

function seedPosts(): void {
  const now = new Date().toISOString();

  run(`
    INSERT OR IGNORE INTO posts (id, title, categoryId, text, author, userId, createdAt)
    VALUES (
      'post-1',
      'Getting Started with TypeScript',
      2,
      'TypeScript is a typed superset of JavaScript.',
      'alice@example.com',
      ${sqlNullableNumber(1)},
      ${sqlString(now)}
    );
  `);
  run(`
    INSERT OR IGNORE INTO posts (id, title, categoryId, text, author, userId, createdAt)
    VALUES (
      'post-2',
      'Weekly Team Update',
      4,
      'Sprint goals were completed and the next milestone is planned.',
      'bob@example.com',
      ${sqlNullableNumber(2)},
      ${sqlString(now)}
    );
  `);
}

function seed(): void {
  initDb();
  seedUsers();
  seedCategories();
  seedPosts();
  console.log('Seed completed');
}

seed();