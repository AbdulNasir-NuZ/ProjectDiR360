import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  dbPool?: Pool;
  dbInitialized?: boolean;
};

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL");
  }
  return connectionString;
}

function getDbPool() {
  if (globalForDb.dbPool) return globalForDb.dbPool;

  const connectionString = getConnectionString();
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.dbPool = pool;
  }

  return pool;
}

export async function ensureSchema() {
  if (globalForDb.dbInitialized) return;

  const db = getDbPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      wallet_address TEXT UNIQUE,
      full_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS kyc_submissions (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      full_name TEXT NOT NULL,
      country TEXT NOT NULL,
      phone TEXT NOT NULL,
      id_type TEXT NOT NULL,
      id_number TEXT NOT NULL,
      document_name TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS companies (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS nft_mints (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'not_minted',
      metadata_uri TEXT,
      token_id TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  globalForDb.dbInitialized = true;
}

export const db = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    const pool = getDbPool() as unknown as Record<PropertyKey, unknown>;
    return Reflect.get(pool, prop, receiver);
  },
});
