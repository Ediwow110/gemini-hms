import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import type { Permission, Role, LabTestDefinition, LabTestParameterDefinition } from '@prisma/client';  
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

if (process.env.NODE_ENV === 'production') {
  console.warn('WARNING: Running seed against a production database! This script is intended for development/demo use only.');
  console.warn('Set NODE_ENV to anything other than "production" to proceed, or remove this guard after review.');
  process.exit(1);
}

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

  // 1a. Create Demo Tenants for Multi-Tenancy testing (demo/sandbox only — not for production use)
  const tenantAlpha = await prisma.tenant.upsert({
    where: { id: '00000000-0000-0000-0000-00000000000a' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-00000000000a',
      name: 'tenant-alpha',
      status: 'ACTIVE',
    },
  });
  console.log('Demo Tenant Alpha created:', tenantAlpha.name);

  const tenantBeta = await prisma.tenant.upsert({
    where: { id: '00000000-0000-0000-0000-00000000000b' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-00000000000b',
      name: 'tenant-beta',
      status: 'ACTIVE',
    },
  });
  console.log('Demo Tenant Beta created:', tenantBeta.name);

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
    { name: 'Pharmacist', id: '00000000-0000-0000-0000-000000000008' },
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

  // 4. Create Default Admin User (dev-only — replace password before production)
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
      mfaEnabled: false,
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
    ],
    'Pharmacist': [
      'patient.view', 'inventory.item.view', 'inventory.stock.dispense', 'queue.view'
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

  // 7. Seed Lab Test Catalog (demo/reference definitions — NOT certified clinical reference data)
  console.warn('WARNING: Lab test catalog entries contain demo/reference ranges only.');
  console.warn('These values are NOT certified, validated, or authoritative for clinical use.');
  console.log('Seeding Lab Test Catalog...');

  const cbcTest = await prisma.labTestDefinition.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: 'CBC',
      },
    },
    update: { isActive: true },
    create: {
      tenantId: tenant.id,
      code: 'CBC',
      name: 'Complete Blood Count (CBC)', // name must match ClinicalOrderItem.itemName for catalog lookup — do not change
      description: '[DEMO] A complete blood count panel measuring cellular components of blood. Reference ranges are demo samples — NOT certified for clinical diagnosis.',
      isActive: true,
    },
  });

  const cbcParameters = [
    { code: 'WBC', parameterName: 'White Blood Cells (WBC)', unit: 'x10^9/L', referenceRangeText: '4.5 - 11.0', minNormal: 4.5, maxNormal: 11.0, minCritical: 2.0, maxCritical: 25.0, displayOrder: 1 },
    { code: 'RBC', parameterName: 'Red Blood Cells (RBC)', unit: 'x10^12/L', referenceRangeText: '4.00 - 5.50', minNormal: 4.0, maxNormal: 5.5, displayOrder: 2 },
    { code: 'Hgb', parameterName: 'Hemoglobin (Hgb)', unit: 'g/L', referenceRangeText: '120 - 160', minNormal: 120, maxNormal: 160, minCritical: 70, maxCritical: 200, displayOrder: 3 },
    { code: 'PLT', parameterName: 'Platelets (PLT)', unit: 'x10^9/L', referenceRangeText: '150 - 450', minNormal: 150, maxNormal: 450, minCritical: 50, maxCritical: 1000, displayOrder: 4 },
    { code: 'HCT', parameterName: 'Hematocrit (HCT)', unit: '%', referenceRangeText: '36 - 46', minNormal: 36, maxNormal: 46, displayOrder: 5 },
    { code: 'MCV', parameterName: 'Mean Corpuscular Volume (MCV)', unit: 'fL', referenceRangeText: '80 - 100', minNormal: 80, maxNormal: 100, displayOrder: 6 },
  ];

  for (const param of cbcParameters) {
    await prisma.labTestParameterDefinition.upsert({
      where: {
        tenantId_testDefinitionId_code: {
          tenantId: tenant.id,
          testDefinitionId: cbcTest.id,
          code: param.code,
        },
      },
      update: {
        parameterName: param.parameterName,
        unit: param.unit,
        referenceRangeText: param.referenceRangeText,
        minNormal: param.minNormal,
        maxNormal: param.maxNormal,
        minCritical: param.minCritical ?? null,
        maxCritical: param.maxCritical ?? null,
        displayOrder: param.displayOrder,
        isActive: true,
      },
      create: {
        tenantId: tenant.id,
        testDefinitionId: cbcTest.id,
        code: param.code,
        parameterName: param.parameterName,
        unit: param.unit,
        referenceRangeText: param.referenceRangeText,
        minNormal: param.minNormal,
        maxNormal: param.maxNormal,
        minCritical: param.minCritical ?? null,
        maxCritical: param.maxCritical ?? null,
        displayOrder: param.displayOrder,
        isActive: true,
      },
    });
  }

  const bmpTest = await prisma.labTestDefinition.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: 'BMP',
      },
    },
    update: { isActive: true },
    create: {
      tenantId: tenant.id,
      code: 'BMP',
      name: 'Basic Metabolic Panel (BMP)', // name must match ClinicalOrderItem.itemName for catalog lookup — do not change
      description: '[DEMO] A basic metabolic panel measuring glucose, electrolytes, and kidney function. Reference ranges are demo samples — NOT certified for clinical diagnosis.',
      isActive: true,
    },
  });

  const bmpParameters = [
    { code: 'GLU', parameterName: 'Glucose', unit: 'mg/dL', referenceRangeText: '70 - 110', minNormal: 70, maxNormal: 110, displayOrder: 1 },
    { code: 'NA', parameterName: 'Sodium (Na)', unit: 'mEq/L', referenceRangeText: '135 - 145', minNormal: 135, maxNormal: 145, displayOrder: 2 },
    { code: 'K', parameterName: 'Potassium (K)', unit: 'mEq/L', referenceRangeText: '3.5 - 5.1', minNormal: 3.5, maxNormal: 5.1, displayOrder: 3 },
    { code: 'CL', parameterName: 'Chloride (Cl)', unit: 'mEq/L', referenceRangeText: '96 - 106', minNormal: 96, maxNormal: 106, displayOrder: 4 },
    { code: 'CO2', parameterName: 'Carbon Dioxide (CO2)', unit: 'mEq/L', referenceRangeText: '23 - 29', minNormal: 23, maxNormal: 29, displayOrder: 5 },
    { code: 'BUN', parameterName: 'Blood Urea Nitrogen', unit: 'mg/dL', referenceRangeText: '7 - 20', minNormal: 7, maxNormal: 20, displayOrder: 6 },
    { code: 'CRE', parameterName: 'Creatinine', unit: 'mg/dL', referenceRangeText: '0.6 - 1.2', minNormal: 0.6, maxNormal: 1.2, displayOrder: 7 },
  ];

  for (const param of bmpParameters) {
    await prisma.labTestParameterDefinition.upsert({
      where: {
        tenantId_testDefinitionId_code: {
          tenantId: tenant.id,
          testDefinitionId: bmpTest.id,
          code: param.code,
        },
      },
      update: {
        parameterName: param.parameterName,
        unit: param.unit,
        referenceRangeText: param.referenceRangeText,
        minNormal: param.minNormal,
        maxNormal: param.maxNormal,
        displayOrder: param.displayOrder,
        isActive: true,
      },
      create: {
        tenantId: tenant.id,
        testDefinitionId: bmpTest.id,
        code: param.code,
        parameterName: param.parameterName,
        unit: param.unit,
        referenceRangeText: param.referenceRangeText,
        minNormal: param.minNormal,
        maxNormal: param.maxNormal,
        displayOrder: param.displayOrder,
        isActive: true,
      },
    });
  }

  console.log('Lab Test Catalog seeded: CBC (6 parameters), BMP (7 parameters).');
  console.log('*'.repeat(60));
  console.log('WARNING: This seed creates DEMO data only.');
  console.log('- Reference ranges are sample values — NOT certified for clinical diagnosis.');
  console.log('- Admin account credentials (admin@hospital.com / Admin@123) are for development only.');
  console.log('- Demo tenants (tenant-alpha, tenant-beta) are for multi-tenancy testing only.');
  console.log('Replace or override these values before any production deployment.');
  console.log('*'.repeat(60));
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
