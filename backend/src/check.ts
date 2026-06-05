import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const r = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Attendance' AND column_name = 'date'`);
  console.log(r.rows);
}

check().catch(console.error).finally(() => pool.end());
