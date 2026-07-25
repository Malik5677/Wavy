from pathlib import Path
p = Path(r"C:\Users\Nonyy\Downloads\wavy\backend\src\db\index.ts")
text = p.read_text(encoding="utf-8")
old = '''pool.on("error", (err) => {
  console.error("? PostgreSQL Pool Error:", err);
});

// Test database connection on startup
(async () => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    console.log("? Database Connected Successfully");
    console.log("Server Time:", result.rows[0].now);
    client.release();
  } catch (err) {
    console.error("? Failed to connect to PostgreSQL");
    console.error(err);
  }
})();

export const db = drizzle(pool, { schema });
'''
new = '''pool.on("error", (err) => {
  console.error("? PostgreSQL Pool Error:", err);
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const attempts = Number(process.env.DB_CONNECT_RETRIES || 3);
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const client = await pool.connect();
      const result = await client.query("SELECT NOW()");
      console.log("? Database Connected Successfully");
      console.log("Server Time:", result.rows[0].now);
      client.release();
      break;
    } catch (err) {
      console.error(`? Failed to connect to PostgreSQL (attempt ${attempt}/${attempts}):`, err);
      if (attempt === attempts) {
        console.error("? Unable to connect to PostgreSQL after multiple attempts. Exiting.");
        process.exit(1);
      }
      await delay(2000);
    }
  }
})();

export const db = drizzle(pool, { schema });
'''
if old not in text:
    raise SystemExit('old chunk not found')
p.write_text(text.replace(old, new), encoding='utf-8')
print('patched')