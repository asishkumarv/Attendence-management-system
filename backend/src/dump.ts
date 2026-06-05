import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const attendances = await prisma.attendance.findMany();
  console.log("All attendances:", JSON.stringify(attendances, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
