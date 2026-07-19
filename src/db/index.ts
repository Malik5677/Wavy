import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

console.log("========== DATABASE CONFIG ==========");
console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("SQL_USER:", process.env.SQL_USER);
console.log("SQL_PASSWORD:", process.env.SQL_PASSWORD ? "******" : undefined);
console.log("SQL_HOST:", process.env.SQL_HOST);
console.log("SQL_DB_NAME:", process.env.SQL_DB_NAME);
console.log("SQL_PORT:", process.env.SQL_PORT);
console.log("=====================================");

// Use DATABASE_URL if available, otherwise use SQL_* variables
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
    })
  : new Pool({
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      host: process.env.SQL_HOST,
      database: process.env.SQL_DB_NAME,
      port: Number(process.env.SQL_PORT || 5432),
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
    });

pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL Pool Error:", err);
});

// Test database connection on startup
(async () => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    console.log("✅ Database Connected Successfully");
    console.log("Server Time:", result.rows[0].now);
    client.release();
  } catch (err) {
    console.error("❌ Failed to connect to PostgreSQL");
    console.error(err);
  }
})();

export const db = drizzle(pool, { schema });