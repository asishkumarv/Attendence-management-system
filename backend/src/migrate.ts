import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await pool.query('ALTER TABLE "Attendance" ALTER COLUMN "date" TYPE VARCHAR(255) USING "date"::DATE::VARCHAR');
  await pool.query('ALTER TABLE "Holiday" ALTER COLUMN "date" TYPE VARCHAR(255) USING "date"::DATE::VARCHAR');
  console.log("Migrated columns to VARCHAR!");
}

migrate().catch(console.error).finally(() => pool.end());
