import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import type { Permission, Role } from '@prisma/client';  
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
    where: { id: '00000000-0000-0000-0000-000000000001' }, 
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Central Hospital (Main Branch)',
      status: 'ACTIVE',
    },
  });
  console.log('Tenant created:', tenant.name);

  // 1a. Create Demo Tenants for Multi-Tenancy testing
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

  // 1b. Create a default Branch
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

  // 2. Comprehensive Set of Permissions
  const permissionsData = [
    // Existing Foundation
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
    { name: 'lab.specimen.receive', scope: 'tenant/branch', riskLevel: 'LOW' },
    { name: 'lab.critical.view', scope: 'tenant/branch', riskLevel: 'HIGH' },
    { name: 'lab.critical.acknowledge', scope: 'tenant/branch', riskLevel: 'HIGH' },
    { name: 'lab.critical.escalate', scope: 'tenant/branch', riskLevel: 'CRITICAL' },
    { name: 'catalog.service.view', scope: 'tenant', riskLevel: 'LOW' },
    { name: 'catalog.service.create', scope: 'tenant', riskLevel: 'MEDIUM' },
    { name: 'catalog.service.update', scope: 'tenant', riskLevel: 'MEDIUM' },
    { name: 'catalog.service.deactivate', scope: 'tenant', riskLevel: 'HIGH' },
    { name: 'catalog.manage', scope: 'tenant', riskLevel: 'HIGH' },
    { name: 'inventory.item.view', scope: 'tenant/branch', riskLevel: 'LOW' },
    { name: 'inventory.item.create', scope: 'tenant/branch', riskLevel: 'LOW' },
    { name: 'inventory.item.update', scope: 'tenant/branch', riskLevel: 'LOW' },
    { name: 'inventory.item.deactivate', scope: 'tenant/branch', riskLevel: 'MEDIUM' },
    { name: 'inventory.stock.receive', scope: 'tenant/branch', riskLevel: 'LOW' },
    { name: 'inventory.stock.dispense', scope: 'tenant/branch', riskLevel: 'LOW' },
    { name: 'inventory.adjust.request', scope: 'tenant/branch', riskLevel: 'MEDIUM' },
    { name: 'inventory.adjust.approve', scope: 'tenant/branch', riskLevel: 'HIGH' },
    { name: 'pharmacy.stockmovement.view', scope: 'tenant/branch', riskLevel: 'LOW' },
    { name: 'doctor.patient.view', scope: 'tenant/branch', riskLevel: 'LOW' },
    { name: 'doctor.prescription.view', scope: 'tenant/branch', riskLevel: 'MEDIUM' },
    { name: 'doctor.prescription.create', scope: 'tenant/branch', riskLevel: 'HIGH' },
    { name: 'report.export', scope: 'tenant/branch/role scope', riskLevel: 'HIGH' },
    { name: 'audit.view', scope: 'tenant/branch/role scope', riskLevel: 'HIGH' },
    { name: 'admin.health.view', scope: 'tenant', riskLevel: 'LOW' },
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
    
    // Procurement
    { name: 'procurement.supplier.view', scope: 'tenant/branch', riskLevel: 'LOW' },
    { name: 'procurement.supplier.manage', scope: 'tenant/branch', riskLevel: 'MEDIUM' },
    { name: 'procurement.request.view', scope: 'tenant/branch', riskLevel: 'LOW' },
    { name: 'procurement.request.create', scope: 'tenant/branch', riskLevel: 'LOW' },
    { name: 'procurement.request.approve', scope: 'tenant/branch', riskLevel: 'HIGH' },
    { name: 'procurement.rfq.view', scope: 'tenant/branch', riskLevel: 'LOW' },
    { name: 'procurement.rfq.manage', scope: 'tenant/branch', riskLevel: 'MEDIUM' },
    { name: 'procurement.quote.view', scope: 'tenant/branch', riskLevel: 'LOW' },
    { name: 'procurement.po.view', scope: 'tenant/branch', riskLevel: 'LOW' },
    { name: 'procurement.po.create', scope: 'tenant/branch', riskLevel: 'MEDIUM' },
    { name: 'procurement.po.approve', scope: 'tenant/branch', riskLevel: 'HIGH' },
    { name: 'procurement.receiving.post', scope: 'tenant/branch', riskLevel: 'MEDIUM' },
    { name: 'procurement.vendor.performance.view', scope: 'tenant', riskLevel: 'MEDIUM' },

    // Marketplace
    { name: 'marketplace.buyer.view', scope: 'tenant', riskLevel: 'LOW' },
    { name: 'marketplace.supplier.view', scope: 'tenant', riskLevel: 'LOW' },
    { name: 'marketplace.supplier.manage_listing', scope: 'tenant', riskLevel: 'MEDIUM' },
    { name: 'marketplace.admin.view', scope: 'tenant', riskLevel: 'MEDIUM' },
    { name: 'marketplace.admin.manage', scope: 'tenant', riskLevel: 'HIGH' },

    // Patient Portal
    { name: 'patient.portal.view_own', scope: 'tenant/user', riskLevel: 'LOW' },
    { name: 'patient.portal.message', scope: 'tenant/user', riskLevel: 'LOW' },
    { name: 'patient.portal.appointment.view', scope: 'tenant/user', riskLevel: 'LOW' },
    { name: 'patient.portal.billing.view', scope: 'tenant/user', riskLevel: 'LOW' },
    { name: 'patient.portal.result.view', scope: 'tenant/user', riskLevel: 'LOW' },

    // Field Service
    { name: 'field_service.job.view', scope: 'tenant/user', riskLevel: 'LOW' },
    { name: 'field_service.job.update', scope: 'tenant/user', riskLevel: 'MEDIUM' },
    { name: 'field_service.delivery.proof_create', scope: 'tenant/user', riskLevel: 'LOW' },
    { name: 'field_service.installation.update', scope: 'tenant/user', riskLevel: 'MEDIUM' },
    { name: 'field_service.maintenance.update', scope: 'tenant/user', riskLevel: 'MEDIUM' },

    // IT / Compliance
    { name: 'it.system.view', scope: 'tenant', riskLevel: 'MEDIUM' },
    { name: 'it.support.manage', scope: 'tenant', riskLevel: 'HIGH' },
    { name: 'it.ticket.view', scope: 'tenant', riskLevel: 'MEDIUM' },
    { name: 'it.ticket.manage', scope: 'tenant', riskLevel: 'HIGH' },
    { name: 'compliance.audit.review', scope: 'tenant', riskLevel: 'HIGH' },
    { name: 'compliance.phi.monitor', scope: 'tenant', riskLevel: 'PRIVILEGED' },
    { name: 'compliance.report.export', scope: 'tenant', riskLevel: 'HIGH' },

    // HR
    { name: 'hr.employee.view', scope: 'tenant/branch', riskLevel: 'LOW' },
    { name: 'hr.employee.manage', scope: 'tenant/branch', riskLevel: 'HIGH' },
    { name: 'hr.payroll.view', scope: 'tenant/branch', riskLevel: 'MEDIUM' },
    { name: 'hr.payroll.manage', scope: 'tenant/branch', riskLevel: 'HIGH' },

    // Nursing Tasks
    { name: 'nurse.task.view', scope: 'tenant/branch', riskLevel: 'LOW' },
    { name: 'nurse.task.manage', scope: 'tenant/branch', riskLevel: 'MEDIUM' },
    { name: 'nurse.task.update', scope: 'tenant/branch', riskLevel: 'LOW' },
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

  // 3. Define Roles
  const rolesData = [
    { name: 'Super Admin', id: '00000000-0000-0000-0000-000000000002' },
    { name: 'Branch Admin', id: '00000000-0000-0000-0000-000000000003' },
    { name: 'Receptionist', id: '00000000-0000-0000-0000-000000000004' },
    { name: 'Cashier', id: '00000000-0000-0000-0000-000000000005' },
    { name: 'Med-Tech', id: '00000000-0000-0000-0000-000000000006' },
    { name: 'Doctor', id: '00000000-0000-0000-0000-000000000007' },
    { name: 'Pharmacist', id: '00000000-0000-0000-0000-000000000008' },
    { name: 'Nurse', id: '00000000-0000-0000-0000-000000000009' },
    { name: 'Patient', id: '00000000-0000-0000-0000-000000000011' },
    { name: 'Supplier', id: '00000000-0000-0000-0000-000000000012' },
    { name: 'Procurement Officer', id: '00000000-0000-0000-0000-000000000013' },
    { name: 'HR Staff', id: '00000000-0000-0000-0000-000000000014' },
    { name: 'HR Manager', id: '00000000-0000-0000-0000-000000000015' },
    { name: 'IT Support', id: '00000000-0000-0000-0000-000000000016' },
    { name: 'Compliance Officer', id: '00000000-0000-0000-0000-000000000017' },
    { name: 'Field Technician', id: '00000000-0000-0000-0000-000000000018' },
    { name: 'Marketplace Admin', id: '00000000-0000-0000-0000-000000000019' },
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

  // 4. Role-Permission Mappings
  const rolePermissionMap: Record<string, string[]> = {
    'Super Admin': permissionsData.map(p => p.name), 
    'Branch Admin': [
      'patient.view', 'patient.create', 'patient.update', 
      'order.view', 'order.create', 'order.cancel',
      'billing.invoice.view', 'billing.claim.view', 'billing.claim.create',
      'inventory.item.view', 'inventory.item.create', 'inventory.stock.receive', 'inventory.stock.dispense',
      'queue.view', 'queue.manage', 
      'approval.request.view', 'approval.request.process',
      'report.export', 'audit.view',
      'encounter.create', 'encounter.view', 'encounter.update',
      'procurement.supplier.view', 'procurement.request.view', 'procurement.po.view',
      'nurse.task.view', 'nurse.task.manage',
      'lab.critical.view', 'lab.critical.acknowledge', 'lab.critical.escalate'
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
      'billing.claim.view', 'queue.view'
    ],
    'Med-Tech': [
      'patient.view', 'lab.result.view', 'lab.result.encode',
      'lab.specimen.receive',
      'lab.critical.view', 'lab.critical.acknowledge',
      'inventory.item.view', 'queue.view'
    ],
    'Doctor': [
      'patient.view', 'lab.result.view', 'lab.result.approve', 'lab.result.release',
      'inventory.item.view',
      'encounter.create', 'encounter.view', 'encounter.update', 'queue.view',
      'procurement.request.create',
      'lab.critical.view',
      'doctor.patient.view', 'doctor.prescription.view', 'doctor.prescription.create'
    ],
    'Pharmacist': [
      'patient.view', 'inventory.item.view', 'inventory.stock.dispense', 'pharmacy.stockmovement.view', 'queue.view'
    ],
    'Nurse': [
      'patient.view', 'patient.update', 'encounter.view', 'encounter.update',
      'inventory.item.view', 'queue.view', 'procurement.request.create',
      'nurse.task.view', 'nurse.task.update'
    ],
    'Patient': [
      'patient.portal.view_own', 'patient.portal.message', 'patient.portal.appointment.view',
      'patient.portal.billing.view', 'patient.portal.result.view'
    ],
    'Supplier': [
      'marketplace.supplier.view', 'marketplace.supplier.manage_listing',
      'procurement.quote.view', 'procurement.po.view'
    ],
    'Procurement Officer': [
      'procurement.supplier.view', 'procurement.supplier.manage', 'procurement.request.view',
      'procurement.rfq.view', 'procurement.rfq.manage', 'procurement.quote.view',
      'procurement.po.view', 'procurement.po.create', 'procurement.po.approve',
      'procurement.receiving.post', 'procurement.vendor.performance.view'
    ],
    'HR Staff': [
      'hr.employee.view', 'hr.payroll.view'
    ],
    'HR Manager': [
      'hr.employee.view', 'hr.employee.manage', 'hr.payroll.view', 'hr.payroll.manage',
      'approval.request.process'
    ],
    'IT Support': [
      'it.system.view', 'it.support.manage', 'it.ticket.view', 'it.ticket.manage', 'audit.view'
    ],
    'Compliance Officer': [
      'compliance.audit.review', 'compliance.phi.monitor', 'compliance.report.export',
      'audit.view'
    ],
    'Field Technician': [
      'field_service.job.view', 'field_service.job.update', 'field_service.delivery.proof_create',
      'field_service.installation.update', 'field_service.maintenance.update'
    ],
    'Marketplace Admin': [
      'marketplace.admin.view', 'marketplace.admin.manage'
    ]
  };

  const allRoles = await prisma.role.findMany({ where: { tenantId: tenant.id } });
  const allPerms = await prisma.permission.findMany({ where: { tenantId: tenant.id } });

  console.log('Seeding Role Permissions...');
  for (const roleName of Object.keys(rolePermissionMap)) {
    const role = allRoles.find(r => r.name === roleName);
    if (!role) continue;

    const permsToAssign = rolePermissionMap[roleName];
    for (const permName of permsToAssign) {
      const permission = allPerms.find(p => p.name === permName);
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

  // 5. Create Demo Users
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  
  const demoUsers = [
    { email: 'admin@hospital.com', role: 'Super Admin' },
    { email: 'branch.admin@hospital.com', role: 'Branch Admin' },
    { email: 'receptionist@hospital.com', role: 'Receptionist' },
    { email: 'cashier@hospital.com', role: 'Cashier' },
    { email: 'medtech@hospital.com', role: 'Med-Tech' },
    { email: 'doctor@hospital.com', role: 'Doctor' },
    { email: 'pharmacist@hospital.com', role: 'Pharmacist' },
    { email: 'nurse@hospital.com', role: 'Nurse' },
    { email: 'patient@hospital.com', role: 'Patient' },
    { email: 'supplier@hospital.com', role: 'Supplier' },
    { email: 'procurement@hospital.com', role: 'Procurement Officer' },
    { email: 'hr@hospital.com', role: 'HR Staff' },
    { email: 'hr.manager@hospital.com', role: 'HR Manager' },
    { email: 'it.support@hospital.com', role: 'IT Support' },
    { email: 'compliance@hospital.com', role: 'Compliance Officer' },
    { email: 'field.tech@hospital.com', role: 'Field Technician' },
    { email: 'marketplace.admin@hospital.com', role: 'Marketplace Admin' },
  ];

  // 6. Create a Demo Supplier
  console.log('Seeding Demo Supplier...');
  const demoSupplier = await prisma.supplier.upsert({
    where: { id: '00000000-0000-0000-0000-000000000100' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000100',
      tenantId: tenant.id,
      name: 'Global Medical Supplies Corp',
      contactName: 'John Supplier',
      contactEmail: 'supplier@hospital.com',
      status: 'ACTIVE',
    },
  });

  console.log('Seeding Demo Users...');
  for (const demo of demoUsers) {
    const user = await prisma.user.upsert({
      where: { 
        tenantId_email: {
          tenantId: tenant.id,
          email: demo.email
        }
      },
      update: { 
        passwordHash,
        supplierId: demo.role === 'Supplier' ? demoSupplier.id : null,
      },
      create: {
        tenantId: tenant.id,
        email: demo.email,
        passwordHash,
        mfaEnabled: false,
        supplierId: demo.role === 'Supplier' ? demoSupplier.id : null,
      },
    });

    const role = allRoles.find(r => r.name === demo.role);
    if (role) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: role.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          roleId: role.id,
        },
      });
    }

    // Assign staff users to branch (except Patient and Supplier if they don't strictly need it, but for demo we assign all)
    await prisma.userBranch.upsert({
      where: {
        tenantId_userId_branchId: {
          tenantId: tenant.id,
          userId: user.id,
          branchId: branch.id,
        },
      },
      update: { isActive: true },
      create: {
        tenantId: tenant.id,
        userId: user.id,
        branchId: branch.id,
        isActive: true,
      },
    });
  }

  // 7. Seed Lab Test Catalog
  console.warn('WARNING: Lab test catalog entries contain demo/reference ranges only.');
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
      name: 'Complete Blood Count (CBC)',
      description: '[DEMO] A complete blood count panel measuring cellular components of blood.',
      isActive: true,
    },
  });

  const cbcParameters = [
    { code: 'WBC', parameterName: 'White Blood Cells (WBC)', unit: 'x10^9/L', referenceRangeText: '4.5 - 11.0', minNormal: 4.5, maxNormal: 11.0, displayOrder: 1 },
    { code: 'RBC', parameterName: 'Red Blood Cells (RBC)', unit: 'x10^12/L', referenceRangeText: '4.00 - 5.50', minNormal: 4.0, maxNormal: 5.5, displayOrder: 2 },
    { code: 'Hgb', parameterName: 'Hemoglobin (Hgb)', unit: 'g/L', referenceRangeText: '120 - 160', minNormal: 120, maxNormal: 160, displayOrder: 3 },
    { code: 'PLT', parameterName: 'Platelets (PLT)', unit: 'x10^9/L', referenceRangeText: '150 - 450', minNormal: 150, maxNormal: 450, displayOrder: 4 },
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
      name: 'Basic Metabolic Panel (BMP)',
      description: '[DEMO] A basic metabolic panel measuring glucose, electrolytes, and kidney function.',
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
