import { db } from './backend/src/db/index.js';
import { sql } from 'drizzle-orm';
async function run() {
  await db.execute(sql`TRUNCATE TABLE users CASCADE;`);
  console.log("Truncated users.");
  process.exit(0);
}
run();
