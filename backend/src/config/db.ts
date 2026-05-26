import { Pool } from "pg";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export let pool: Pool;

export async function initDb(): Promise<void> {
  pool = new Pool({
    connectionString: requireEnv("DATABASE_URL")
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS entries (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      date DATE NOT NULL,
      goals_planned TEXT NOT NULL,
      num_goals INTEGER NOT NULL,
      goals_completed INTEGER NOT NULL,
      distractions TEXT[] NOT NULL DEFAULT '{}',
      negative_components TEXT[] NOT NULL DEFAULT '{}',
      positive_components TEXT[] NOT NULL DEFAULT '{}',
      difficulty INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      notes TEXT
    )
  `);
}
