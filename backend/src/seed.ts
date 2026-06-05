import { PrismaClient, Role, Status } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = 'admin@attendify.com';
  const defaultPassword = 'admin';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    console.log('Admin user already exists.');
    return;
  }

  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: adminEmail,
      password: hashedPassword,
      role: Role.ADMIN,
      status: Status.APPROVED,
    }
  });

  console.log('Created default admin:', admin.email);
  console.log('Password:', defaultPassword);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
