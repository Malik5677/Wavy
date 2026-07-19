import { Pool } from "pg";
const pool = new Pool({
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  host: process.env.SQL_HOST,
  database: process.env.SQL_DB_NAME,
});
async function run() {
  try {
    await pool.query('ALTER TABLE chat_members ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;');
    await pool.query('ALTER TABLE chat_members ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;');
    console.log("Success");
  } catch (e) {
    console.error(e.message);
  }
  process.exit(0);
}
run();
