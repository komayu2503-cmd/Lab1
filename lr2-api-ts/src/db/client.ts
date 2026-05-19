import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

type SqliteDatabase = InstanceType<typeof Database>;

let database: SqliteDatabase | null = null;

function getDatabasePath(): string {
  const configured = process.env.DB_PATH?.trim();

  return configured && configured.length > 0
    ? path.resolve(configured)
    : path.resolve(process.cwd(), 'data', 'app.db');
}

function ensureDatabase(): SqliteDatabase {
  if (database) {
    return database;
  }

  const dbPath = getDatabasePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  database = new Database(dbPath);
  database.pragma('foreign_keys = ON');
  console.log(`SQLite DB opened: ${dbPath}`);
  return database;
}

export function getDb(): SqliteDatabase {
  return ensureDatabase();
}

export function exec(sql: string): void {
  ensureDatabase().exec(sql);
}

export function run(sql: string, params?: unknown[]): { changes: number; lastInsertRowid: number } {
  const stmt = ensureDatabase().prepare(sql);
  const result = params ? stmt.run(...params) : stmt.run();

  return {
    changes: result.changes,
    lastInsertRowid: Number(result.lastInsertRowid)
  };
}

export function get<T>(sql: string, params?: unknown[]): T | undefined {
  const stmt = ensureDatabase().prepare(sql);
  return (params ? stmt.get(...params) : stmt.get()) as T | undefined;
}

export function all<T>(sql: string, params?: unknown[]): T[] {
  const stmt = ensureDatabase().prepare(sql);
  return (params ? stmt.all(...params) : stmt.all()) as T[];
}

export function sqlString(value: string): string {
  return `'${String(value).replace(/'/g, "''")}'`;
}

export function sqlNullableNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? 'NULL' : String(Number(value));
}

export function closeDb(): void {
  if (!database) {
    return;
  }

  database.close();
  database = null;
}