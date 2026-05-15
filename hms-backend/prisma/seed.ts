import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import type { Permission, Role } from '@prisma/client';  
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function main() {
  console.log('Seed started...');

  // 1. Create a default Tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' }, // Deterministic UUID for seeding
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Central Hospital (Main Branch)',
      status: 'ACTIVE',
    },
  });
  console.log('Tenant created:', tenant.name);

  // 1b. Create a default Branch for the default Tenant
  const branch = await prisma.branch.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      tenantId: tenant.id,
      name: 'Main Branch',
      code: 'MAIN',
    },
  });
  console.log('Branch created:', branch.name);

  // 2. Minimum Set of Permissions (Section 9.1)
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
  ];

  console.log('Seeding Permissions...');
  for (const p of permissionsData) {
    await prisma.permission.upsert({
      where: {
        tenantId_name: {
          tenantId: tenant.id,
          name: p.name,
        },
      },
      update: { scope: p.scope, riskLevel: p.riskLevel },
      create: {
        tenantId: tenant.id,
        name: p.name,
        scope: p.scope,
        riskLevel: p.riskLevel,
      },
    });
  }

  // 3. Create Basic Roles
  const rolesData = [
    { name: 'Super Admin', id: '00000000-0000-0000-0000-000000000002' },
    { name: 'Branch Admin', id: '00000000-0000-0000-0000-000000000003' },
    { name: 'Receptionist', id: '00000000-0000-0000-0000-000000000004' },
    { name: 'Cashier', id: '00000000-0000-0000-0000-000000000005' },
    { name: 'Med-Tech', id: '00000000-0000-0000-0000-000000000006' },
    { name: 'Doctor', id: '00000000-0000-0000-0000-000000000007' },
  ];

  console.log('Seeding Roles...');
  for (const r of rolesData) {
    await prisma.role.upsert({
      where: { id: r.id },
      update: { status: 'ACTIVE', isSystem: true },
      create: {
        id: r.id,
        tenantId: tenant.id,
        name: r.name,
        status: 'ACTIVE',
        isSystem: true,
      },
    });
  }

  // 4. Create Default Admin User
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const user = await prisma.user.upsert({
    where: { 
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@hospital.com'
      }
    },
    update: {
      passwordHash: passwordHash
    },
    create: {
      tenantId: tenant.id,
      email: 'admin@hospital.com',
      passwordHash: passwordHash,
      isMfaEnabled: false,
    },
  });
  console.log('User created:', user.email);

  // 5. Link User to Super Admin Role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: '00000000-0000-0000-0000-000000000002'
      }
    },
    update: {},
    create: {
      userId: user.id,
      roleId: '00000000-0000-0000-0000-000000000002',
    },
  });
  console.log('User linked to role.');

  // 5b. Assign User to default Branch
  await prisma.userBranch.upsert({
    where: {
      tenantId_userId_branchId: {
        tenantId: tenant.id,
        userId: user.id,
        branchId: branch.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: user.id,
      branchId: branch.id,
      isActive: true,
    },
  });
  console.log('User assigned to branch:', branch.name);

  // 6. Map role names to permissions
  const allRoles: Role[] = await prisma.role.findMany({ where: { tenantId: tenant.id } });
  const allPerms: Permission[] = await prisma.permission.findMany({ where: { tenantId: tenant.id } });

  const rolePermissionMap: Record<string, string[]> = {
    'Super Admin': permissionsData.map(p => p.name), // Has everything
    'Branch Admin': [
      'patient.view', 'patient.create', 'patient.update', 
      'order.view', 'order.create', 'order.cancel',
      'billing.invoice.view', 'billing.claim.view', 'billing.claim.create',
      'inventory.item.view', 'inventory.item.create', 'inventory.stock.receive', 'inventory.stock.dispense',
      'queue.view', 'queue.manage', 
      'approval.request.view', 'approval.request.process',
      'report.export', 'audit.view',
      'encounter.create', 'encounter.view', 'encounter.update'
    ],
    'Receptionist': [
      'patient.view', 'patient.create', 'patient.update', 
      'order.create', 'order.view',
      'queue.view', 'queue.manage',
      'encounter.create', 'encounter.view'
    ],
    'Cashier': [
      'patient.view', 'order.view', 'billing.invoice.view', 
      'billing.payment.create', 'billing.refund.request',
      'billing.claim.view'
    ],
    'Med-Tech': [
      'patient.view', 'lab.result.view', 'lab.result.encode',
      'inventory.item.view'
    ],
    'Doctor': [
      'patient.view', 'lab.result.view', 'lab.result.approve', 'lab.result.release',
      'inventory.item.view',
      'encounter.create', 'encounter.view', 'encounter.update'
    ]
  };

  console.log('Seeding Role Permissions...');
  for (const roleName of Object.keys(rolePermissionMap)) {
    const role = allRoles.find(r => r.name === roleName);
    if (!role) continue;

    const permsToAssign = rolePermissionMap[roleName];
    for (const permName of permsToAssign) {
      const permission = allPerms.find((p: Permission) => p.name === permName);
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
