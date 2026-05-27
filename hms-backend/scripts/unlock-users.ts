import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.user.updateMany({
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    }
  });
  console.log('All user accounts unlocked.');
  await prisma.$disconnect();
  await pool.end();
}
main();
