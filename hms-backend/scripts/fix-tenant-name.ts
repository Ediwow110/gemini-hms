import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Update name of the primary seeded tenant to Central Hospital (Main Branch)
  await prisma.tenant.update({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    data: { name: 'Central Hospital (Main Branch)' }
  });
  console.log('Primary tenant name updated to "Central Hospital (Main Branch)".');

  // Also unlock all user accounts to be safe
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
