import { db } from "./src/db";
import { sql } from "drizzle-orm";
async function run() {
  const res = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'messages';`);
  console.log(res.rows.map(r => r.column_name));
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
