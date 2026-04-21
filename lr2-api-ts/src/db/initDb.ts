import { all, exec, getDb, run, sqlString } from "./client.js";
import { migrations } from "./migrations.js";

type AppliedMigration = {
  name: string;
};

export function initDb(): void {
  const db = getDb();

  exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      appliedAt TEXT NOT NULL
    );
  `);

  const applied = new Set(all<AppliedMigration>(`
    SELECT name
    FROM schema_migrations
    ORDER BY name ASC;
  `).map((migration) => migration.name));

  for (const migration of migrations) {
    if (applied.has(migration.name)) {
      continue;
    }

    const transaction = db.transaction(() => {
      exec(migration.sql);
      run(`
        INSERT INTO schema_migrations (name, appliedAt)
        VALUES (${sqlString(migration.name)}, ${sqlString(new Date().toISOString())});
      `);
    });

    transaction();
    console.log(`Applied migration: ${migration.name}`);
  }

  console.log('DB schema initialized');
}