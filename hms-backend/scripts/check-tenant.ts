import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log('Tenants:', tenants);
  const users = await prisma.user.findMany({
    include: { tenant: true }
  });
  console.log('Users (first 3):', users.slice(0, 3).map(u => ({ email: u.email, tenantName: u.tenant.name })));
  await prisma.$disconnect();
  await pool.end();
}
main();
