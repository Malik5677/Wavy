import { execSync } from 'child_process';
import process from 'process';

function runPrisma() {
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl && process.env.SQL_USER && process.env.SQL_HOST) {
    dbUrl = `postgresql://${process.env.SQL_USER}:${process.env.SQL_PASSWORD}@localhost/${process.env.SQL_DB_NAME}?host=${process.env.SQL_HOST}`;
  }
  if (!dbUrl) {
    console.error("No DATABASE_URL or SQL_ environment variables found.");
    process.exit(1);
  }
  
  process.env.DATABASE_URL = dbUrl;
  console.log("Running Prisma with configured DATABASE_URL");
  try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    execSync('npx prisma generate', { stdio: 'inherit' });
  } catch (err) {
    console.error("Prisma command failed.");
    process.exit(1);
  }
}

runPrisma();
