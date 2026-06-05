import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$executeRawUnsafe(`ALTER DATABASE neondb SET timezone TO 'Asia/Kolkata';`);
  console.log("Database timezone updated to Asia/Kolkata");
}

main().catch(console.error).finally(() => prisma.$disconnect());
