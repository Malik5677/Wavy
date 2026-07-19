import { eq } from 'drizzle-orm';
try {
  eq({}, undefined);
  console.log("No error thrown!");
} catch (e) {
  console.log("SYNC ERROR:", e.message);
}
