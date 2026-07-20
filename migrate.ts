import dotenv from 'dotenv';
dotenv.config();

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  const client = process.env.DATABASE_URL
    ? new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
    : new Client({
        user: process.env.SQL_ADMIN_USER || process.env.SQL_USER,
        password: process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD,
        host: process.env.SQL_HOST,
        database: process.env.SQL_DB_NAME,
      });

  try {
    await client.connect();
    console.log("Connected to database.");
    
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

    const drizzleDir = path.join(process.cwd(), 'drizzle');
    const files = fs.readdirSync(drizzleDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      console.log(`Running migration ${file}...`);
      const sql = fs.readFileSync(path.join(drizzleDir, file), 'utf8');
      
      const res = await client.query(`SELECT id FROM __drizzle_migrations WHERE hash = $1`, [file]);
      if (res.rows.length === 0) {
        const statements = sql.split('--> statement-breakpoint');
        for (const stmt of statements) {
          if (stmt.trim()) {
            await client.query(stmt);
          }
        }
        await client.query(`INSERT INTO __drizzle_migrations (hash, created_at) VALUES ($1, $2)`, [file, Date.now()]);
        console.log(`Successfully applied ${file}`);
      } else {
        console.log(`Migration ${file} already applied.`);
      }
    }
    
    // Grant permissions to the app user
    if (process.env.SQL_USER) {
       console.log(`Granting permissions to ${process.env.SQL_USER}`);
       await client.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${process.env.SQL_USER}`);
       await client.query(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${process.env.SQL_USER}`);
       await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO ${process.env.SQL_USER}`);
       await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO ${process.env.SQL_USER}`);
    }
    
    console.log("All migrations applied successfully!");
    await client.end();
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigrations();
