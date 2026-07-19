import { Pool } from "pg";
const pool = new Pool({
  user: process.env.SQL_ADMIN_USER,
  password: process.env.SQL_ADMIN_PASSWORD,
  host: process.env.SQL_HOST,
  database: process.env.SQL_DB_NAME,
});
async function run() {
  try {
    await pool.query('ALTER TABLE chat_members ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;');
    console.log("Added is_pinned");
  } catch(e) {}
  try {
    await pool.query('ALTER TABLE chat_members ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;');
    console.log("Added is_archived");
  } catch(e) {}
  
  process.exit(0);
}
run();
