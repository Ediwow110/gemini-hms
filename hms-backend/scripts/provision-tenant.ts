import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { provisionSystemActor } from '../src/tenant/tenant-provisioning';

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

      // 3. Seed Permissions scoped exclusively to tenantId
      const permissionsData = [
        { name: 'patient.view', scope: 'tenant/branch', riskLevel: 'LOW' },
        { name: 'patient.create', scope: 'tenant/branch', riskLevel: 'LOW' },
        { name: 'patient.update', scope: 'tenant/branch', riskLevel: 'LOW' },
        { name: 'patient.merge.request', scope: 'tenant', riskLevel: 'HIGH' },
        { name: 'patient.merge.approve', scope: 'tenant', riskLevel: 'PRIVILEGED' },
        { name: 'order.create', scope: 'tenant/branch', riskLevel: 'LOW' },
        { name: 'order.cancel', scope: 'tenant/branch', riskLevel: 'LOW' },
        { name: 'order.view', scope: 'tenant/branch', riskLevel: 'LOW' },
        { name: 'billing.payment.create', scope: 'tenant/branch/cashier session', riskLevel: 'LOW' },
        { name: 'billing.invoice.view', scope: 'tenant/branch', riskLevel: 'LOW' },
        { name: 'billing.refund.request', scope: 'tenant/branch', riskLevel: 'MEDIUM' },
        { name: 'billing.refund.approve', scope: 'tenant/branch', riskLevel: 'HIGH' },
        { name: 'billing.payment.void.request', scope: 'tenant/branch', riskLevel: 'MEDIUM' },
        { name: 'billing.claim.view', scope: 'tenant/branch', riskLevel: 'LOW' },
        { name: 'billing.claim.create', scope: 'tenant/branch', riskLevel: 'LOW' },
        { name: 'billing.claim.process', scope: 'tenant/branch', riskLevel: 'HIGH' },
        { name: 'lab.result.encode', scope: 'tenant/branch/department', riskLevel: 'LOW' },
        { name: 'lab.result.validate', scope: 'tenant/branch/department', riskLevel: 'MEDIUM' },
        { name: 'lab.result.approve', scope: 'tenant/branch/department', riskLevel: 'HIGH' },
        { name: 'lab.result.release', scope: 'tenant/branch/department', riskLevel: 'HIGH' },
        { name: 'lab.result.view', scope: 'tenant/branch/department', riskLevel: 'LOW' },
        { name: 'lab.result.amend.request', scope: 'tenant/branch', riskLevel: 'MEDIUM' },
        { name: 'catalog.service.view', scope: 'tenant', riskLevel: 'LOW' },
        { name: 'catalog.service.create', scope: 'tenant', riskLevel: 'MEDIUM' },
        { name: 'catalog.service.update', scope: 'tenant', riskLevel: 'MEDIUM' },
        { name: 'catalog.service.deactivate', scope: 'tenant', riskLevel: 'HIGH' },
        { name: 'inventory.item.view', scope: 'tenant/branch', riskLevel: 'LOW' },
        { name: 'inventory.item.create', scope: 'tenant/branch', riskLevel: 'LOW' },
        { name: 'inventory.item.update', scope: 'tenant/branch', riskLevel: 'LOW' },
        { name: 'inventory.item.deactivate', scope: 'tenant/branch', riskLevel: 'MEDIUM' },
        { name: 'inventory.stock.receive', scope: 'tenant/branch', riskLevel: 'LOW' },
        { name: 'inventory.stock.dispense', scope: 'tenant/branch', riskLevel: 'LOW' },
        { name: 'inventory.adjust.request', scope: 'tenant/branch', riskLevel: 'MEDIUM' },
        { name: 'inventory.adjust.approve', scope: 'tenant/branch', riskLevel: 'HIGH' },
        { name: 'report.export', scope: 'tenant/branch/role scope', riskLevel: 'HIGH' },
        { name: 'audit.view', scope: 'tenant/branch/role scope', riskLevel: 'HIGH' },
        { name: 'audit.self', scope: 'tenant/branch/role scope', riskLevel: 'HIGH' },
        { name: 'audit.export', scope: 'tenant/branch/role scope', riskLevel: 'HIGH' },
        { name: 'admin.role.change', scope: 'tenant/system', riskLevel: 'PRIVILEGED' },
        { name: 'approval.request.create', scope: 'tenant/branch', riskLevel: 'MEDIUM' },
        { name: 'approval.request.view', scope: 'tenant/branch', riskLevel: 'MEDIUM' },
        { name: 'approval.request.process', scope: 'tenant/branch', riskLevel: 'HIGH' },
        { name: 'billing.reversal.apply', scope: 'tenant/branch', riskLevel: 'HIGH' },
        { name: 'queue.view', scope: 'tenant/branch', riskLevel: 'LOW' },
        { name: 'queue.manage', scope: 'tenant/branch', riskLevel: 'LOW' },
        { name: 'notification.view', scope: 'tenant/user', riskLevel: 'LOW' },
        { name: 'notification.manage', scope: 'tenant/branch', riskLevel: 'MEDIUM' },
        { name: 'encounter.create', scope: 'tenant/branch', riskLevel: 'LOW' },
        { name: 'encounter.view', scope: 'tenant/branch', riskLevel: 'LOW' },
        { name: 'encounter.update', scope: 'tenant/branch', riskLevel: 'LOW' },
        { name: 'admin.health.view', scope: 'tenant', riskLevel: 'HIGH' },
        { name: 'admin.metrics.view', scope: 'tenant', riskLevel: 'HIGH' },
      ];

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
      const roleNames = ['Super Admin', 'Branch Admin', 'Doctor', 'Cashier', 'Nurse'];
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
      const rolePermissionMap: Record<string, string[]> = {
        'Super Admin': permissionsData.map(p => p.name),
        'Branch Admin': [
          'patient.view', 'patient.create', 'patient.update', 
          'order.view', 'order.create', 'order.cancel',
          'billing.invoice.view', 'billing.claim.view', 'billing.claim.create',
          'inventory.item.view', 'inventory.item.create', 'inventory.stock.receive', 'inventory.stock.dispense',
          'queue.view', 'queue.manage', 
          'approval.request.view', 'approval.request.process',
          'report.export', 'audit.view', 'audit.self',
          'encounter.create', 'encounter.view', 'encounter.update'
        ],
        'Doctor': [
          'patient.view', 'lab.result.view', 'lab.result.approve', 'lab.result.release',
          'inventory.item.view', 'encounter.create', 'encounter.view', 'encounter.update'
        ],
        'Cashier': [
          'patient.view', 'order.view', 'billing.invoice.view', 
          'billing.payment.create', 'billing.refund.request', 'billing.claim.view'
        ],
        'Nurse': [
          'patient.view', 'patient.create', 'patient.update', 'queue.view', 'queue.manage', 'encounter.create', 'encounter.view'
        ]
      };

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
