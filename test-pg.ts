import { Client } from 'pg';

async function testConnection() {
  const client = new Client({
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    host: process.env.SQL_HOST,
    database: process.env.SQL_DB_NAME,
  });

  try {
    await client.connect();
    console.log("Connected successfully!");
    const res = await client.query('SELECT NOW()');
    console.log("Time:", res.rows[0].now);
    await client.end();
  } catch (err) {
    console.error("Connection failed:", err);
  }
}

testConnection();
