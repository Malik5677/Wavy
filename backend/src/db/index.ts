import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
const dbSslExplicitFalse = process.env.DB_SSL === "false" || process.env.DB_SSL === "0";
const useSsl = databaseUrl
  ? !dbSslExplicitFalse
  : process.env.DB_SSL === "true" || process.env.DB_SSL === "1";
const poolConfig = databaseUrl

  ? {
      connectionString: databaseUrl,
      ssl: !dbSslExplicitFalse ? { rejectUnauthorized: false } : undefined,
      max: Number(process.env.PG_MAX_CLIENTS || 10),
      idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 60000),
      connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 20000),
      keepAlive: true,
    }
  : {
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      host: process.env.SQL_HOST,
      database: process.env.SQL_DB_NAME,
      port: Number(process.env.SQL_PORT || 5432),
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      max: Number(process.env.PG_MAX_CLIENTS || 10),
      idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 60000),
      connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 20000),
      keepAlive: true,
    };

if (!databaseUrl && !process.env.SQL_USER) {
  throw new Error("Missing database configuration: set DATABASE_URL or SQL_USER/SQL_PASSWORD/SQL_HOST/SQL_DB_NAME.");
}

const pool = new Pool(poolConfig as any);

pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL Pool Error:", err);
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const attempts = Number(process.env.DB_CONNECT_RETRIES || 3);
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const client = await pool.connect();
      const result = await client.query("SELECT NOW()");
      console.log("✅ Database Connected Successfully");
      console.log("Server Time:", result.rows[0].now);
      client.release();
      break;
    } catch (err) {
      console.error(`❌ Failed to connect to PostgreSQL (attempt ${attempt}/${attempts}):`, err);
      if (attempt === attempts) {
        console.error("❌ Unable to connect to PostgreSQL after multiple attempts. Exiting.");
        process.exit(1);
      }
      await delay(2000);
    }
  }
})();

export const db = drizzle(pool, { schema });