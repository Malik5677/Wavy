import { db } from "./backend/src/db";
import { sql } from "drizzle-orm";
async function run() {
  await db.execute(sql`ALTER TABLE messages ADD COLUMN reply_to_id uuid;`);
  await db.execute(sql`ALTER TABLE messages ADD COLUMN reaction varchar(50);`);
  await db.execute(sql`ALTER TABLE messages ADD COLUMN is_deleted boolean DEFAULT false NOT NULL;`);
  console.log("Columns added successfully");
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
