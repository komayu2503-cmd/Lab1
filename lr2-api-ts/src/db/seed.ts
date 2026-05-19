import { initDb } from "./initDb.js";
import { run } from "./client.js";
import bcrypt from "bcryptjs";

function seedUsers(): void {
  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync("11111111", 10);

  run(
    `INSERT OR IGNORE INTO users (name, email, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?);`,
    ['Alice', 'alice@example.com', passwordHash, 'user', now]
  );
  run(
    `INSERT OR IGNORE INTO users (name, email, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?);`,
    ['Bob', 'bob@example.com', passwordHash, 'user', now]
  );
  run(
    `INSERT OR IGNORE INTO users (name, email, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?);`,
    ['Charlie', 'charlie@example.com', passwordHash, 'user', now]
  );

  // Backfill password hash for existing users in already initialized DBs.
  run(`UPDATE users SET passwordHash = ?, role = COALESCE(role, 'user') WHERE passwordHash IS NULL;`, [
    passwordHash,
  ]);

  // Ensure seeded default users always keep the expected demo password.
  run(
    `UPDATE users
     SET passwordHash = ?, role = COALESCE(role, 'user')
     WHERE email IN ('alice@example.com', 'bob@example.com', 'charlie@example.com');`,
    [passwordHash]
  );
}

function seedCategories(): void {
  const now = new Date().toISOString();

  run(
    `INSERT OR IGNORE INTO categories (name, createdAt) VALUES (?, ?);`,
    ['News', now]
  );
  run(
    `INSERT OR IGNORE INTO categories (name, createdAt) VALUES (?, ?);`,
    ['Tutorial', now]
  );
  run(
    `INSERT OR IGNORE INTO categories (name, createdAt) VALUES (?, ?);`,
    ['Opinion', now]
  );
  run(
    `INSERT OR IGNORE INTO categories (name, createdAt) VALUES (?, ?);`,
    ['Announcement', now]
  );
}

function seedPosts(): void {
  const now = new Date().toISOString();

  run(
    `
    INSERT OR IGNORE INTO posts (id, title, categoryId, text, author, userId, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `,
    [
      'post-1',
      'Getting Started with TypeScript',
      2,
      'TypeScript is a typed superset of JavaScript.',
      'alice@example.com',
      1,
      now
    ]
  );
  run(
    `
    INSERT OR IGNORE INTO posts (id, title, categoryId, text, author, userId, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `,
    [
      'post-2',
      'Weekly Team Update',
      4,
      'Sprint goals were completed and the next milestone is planned.',
      'bob@example.com',
      2,
      now
    ]
  );
}

function seed(): void {
  initDb();
  seedUsers();
  seedCategories();
  seedPosts();
  console.log('Seed completed');
}

seed();