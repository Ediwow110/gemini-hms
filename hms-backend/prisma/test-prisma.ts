import * as dotenv from 'dotenv';
dotenv.config();
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
    include: {
      userRoles: { include: { role: true } }
    }
  });
  console.log('Users:', users.map(u => ({ id: u.id, email: u.email, tenantId: u.tenantId, roles: u.userRoles.map(ur => ur.role.name) })));
}

main()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect();
    pool.end();
  });
