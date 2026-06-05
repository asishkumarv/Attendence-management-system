import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function insertTest() {
  const d = new Date(Date.UTC(2026, 5, 4));
  console.log("Inserting JS Date:", d.toISOString());
  
  // Test pg driver parametrization
  const res1 = await pool.query("INSERT INTO \"Holiday\" (date, description, \"updatedAt\") VALUES ($1, $2, NOW()) RETURNING *", [d, "Test pg adapter"]);
  console.log("PG Adapter inserted:", res1.rows[0]);
}

insertTest().catch(console.error).finally(() => pool.end());
