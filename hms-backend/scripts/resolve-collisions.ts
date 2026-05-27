import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Rename any other tenant named 'Test Tenant'
  await prisma.tenant.updateMany({
    where: {
      name: { equals: 'Test Tenant', mode: 'insensitive' },
      NOT: { id: '00000000-0000-0000-0000-000000000001' }
    },
    data: { name: 'Collision Tenant' }
  });
  console.log('Renamed other conflicting Test Tenant entries.');

  // 2. Ensure primary tenant name is 'Test Tenant'
  await prisma.tenant.update({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    data: { name: 'Test Tenant' }
  });
  console.log('Primary tenant set to "Test Tenant".');

  // 3. Unlock users
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
