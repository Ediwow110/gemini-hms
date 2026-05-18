import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const roleId = '00000000-0000-0000-0000-000000000002'; // Super Admin

  console.log('Seeding health permissions...');

  const perms = ['admin.health.view', 'admin.metrics.view'];

  for (const name of perms) {
    const p = await prisma.permission.upsert({
      where: {
        tenantId_name: { tenantId, name }
      },
      update: {},
      create: {
        tenantId,
        name,
        scope: 'tenant',
        riskLevel: 'HIGH'
      }
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: p.id
        }
      },
      update: {},
      create: {
        roleId,
        permissionId: p.id
      }
    });
    console.log(`Permission ${name} seeded and mapped to Super Admin.`);
  }

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
