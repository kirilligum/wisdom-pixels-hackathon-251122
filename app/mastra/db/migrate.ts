import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure .data directory exists
const dataDir = path.join(process.cwd(), '.data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database file path
const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(dataDir, 'wisdom-pixels.db');

console.log('Running migrations...');
console.log('Database path:', dbPath);

const sqlite = new Database(dbPath);
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite);

try {
  migrate(db, { migrationsFolder: path.join(process.cwd(), 'mastra/db/migrations') });
  console.log('✅ Migrations completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  sqlite.close();
}
