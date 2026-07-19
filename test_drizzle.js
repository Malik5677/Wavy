const { eq } = require('drizzle-orm');
try {
  eq({}, undefined);
} catch (e) {
  console.log("SYNC ERROR:", e.message);
}
