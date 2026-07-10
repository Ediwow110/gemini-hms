import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { provisionSystemActor } from '../src/tenant/tenant-provisioning';
import {
  AUTHORIZATION_PERMISSIONS,
  SYSTEM_ROLE_NAMES,
  SYSTEM_ROLE_PERMISSIONS,
} from '../src/auth/authorization-catalog';

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag: string): string => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : '';
  };

  const name = getArg('--name');
  const branchName = getArg('--branch');
  const adminEmail = getArg('--adminEmail');
  const adminPassword = getArg('--adminPassword') || 'ClinicAdmin@123';

  if (!name || !branchName || !adminEmail) {
    console.error('Usage: npx tsx scripts/provision-tenant.ts --name "Clinic Name" --branch "Primary Branch" --adminEmail "admin@clinic.com" [--adminPassword "securePass"]');
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('CRITICAL: DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log(`[PROVISION] Starting provisioning for tenant "${name}"...`);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name,
          status: 'ACTIVE',
        },
      });
      console.log(`[PROVISION] Created Tenant: ${tenant.name} (${tenant.id})`);

      // 2a. Provision a non-interactive system actor for this tenant
      const { actorId: systemActorId } = await provisionSystemActor(tx, tenant.id);
      console.log(`[PROVISION] Provisioned system actor: ${systemActorId}`);

      // 3. Create primary corporate Branch
      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: branchName,
          code: 'MAIN',
        },
      });
      console.log(`[PROVISION] Created primary corporate Branch: ${branch.name} (${branch.id})`);

      // 3. Seed the canonical permission catalog for this tenant.
      const permissionsData = AUTHORIZATION_PERMISSIONS;
      const createdPermissions = [];
      for (const p of permissionsData) {
        const createdPerm = await tx.permission.create({
          data: {
            tenantId: tenant.id,
            name: p.name,
            scope: p.scope,
            riskLevel: p.riskLevel,
          },
        });
        createdPermissions.push(createdPerm);
      }
      console.log(`[PROVISION] Seeded ${createdPermissions.length} tenant-scoped permissions.`);

      // 4. Seed system roles
      const roleNames = SYSTEM_ROLE_NAMES;
      const seededRoles: Record<string, any> = {};

      for (const rName of roleNames) {
        const role = await tx.role.create({
          data: {
            tenantId: tenant.id,
            name: rName,
            status: 'ACTIVE',
            isSystem: true,
          },
        });
        seededRoles[rName] = role;
      }
      console.log(`[PROVISION] Seeded ${roleNames.length} system roles.`);

      // 5. Map permissions to roles
      const rolePermissionMap = SYSTEM_ROLE_PERMISSIONS;

      for (const [rName, perms] of Object.entries(rolePermissionMap)) {
        const role = seededRoles[rName];
        for (const pName of perms) {
          const perm = createdPermissions.find(p => p.name === pName);
          if (perm) {
            await tx.rolePermission.create({
              data: {
                roleId: role.id,
                permissionId: perm.id,
              },
            });
          }
        }
      }
      console.log('[PROVISION] Successfully mapped role permissions.');

      // 6. Register administrator User with mfaEnabled: true
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const adminUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: adminEmail,
          passwordHash,
          mfaEnabled: true,
        },
      });
      console.log(`[PROVISION] Registered administrator account: ${adminUser.email} (MFA enabled: true)`);

      // 7. Associate administrator to Super Admin role
      await tx.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: seededRoles['Super Admin'].id,
          status: 'ACTIVE',
        },
      });

      // 8. Associate administrator to branch
      await tx.userBranch.create({
        data: {
          tenantId: tenant.id,
          userId: adminUser.id,
          branchId: branch.id,
          isActive: true,
        },
      });
      console.log('[PROVISION] Associated administrator to Super Admin role and default Branch.');

      // 9. Seed numbering sequences starting at currentVal: 0
      const entities = [
        { type: 'PATIENT', prefix: 'PAT-', padding: 6 },
        { type: 'INVOICE', prefix: 'INV-', padding: 6 },
        { type: 'RECEIPT', prefix: 'REC-', padding: 6 },
        { type: 'ORDER', prefix: 'ORD-', padding: 6 }
      ];

      for (const ent of entities) {
        await tx.numberingSequence.create({
          data: {
            tenantId: tenant.id,
            branchId: branch.id,
            entityType: ent.type,
            prefix: ent.prefix,
            currentVal: 0,
            padding: ent.padding,
          },
        });
      }
      console.log('[PROVISION] Configured default branch numbering sequences.');

      return {
        tenantId: tenant.id,
        branchId: branch.id,
        adminEmail: adminUser.email,
      };
    });

    console.log(`\n🎉 [PROVISION_SUCCESS] Clinic Tenant Successfully Initialized!`);
    console.log(`- Tenant ID: ${result.tenantId}`);
    console.log(`- Branch ID: ${result.branchId}`);
    console.log(`- Admin Email: ${result.adminEmail}`);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error(`\n❌ [PROVISION_FAILED] Transaction aborted. Reason:`, error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
