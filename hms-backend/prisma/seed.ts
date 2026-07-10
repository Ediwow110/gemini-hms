import { PrismaClient, ListingStatus, OrderStatus, ShipmentStatus, DeliveryJobStatus, TaskStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://hms_local_user:hms_secure_pass@localhost:5432/gemini_hms_local?schema=public',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Starting System-Wide Real-Data Seeding...');

  // 1. CLEANUP: Start fresh
  console.log('🧹 Cleaning database...');
  await prisma.queueEntry.deleteMany();
  await prisma.serviceItem.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.notificationOutbox.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.marketplaceOrderItem.deleteMany();
  await prisma.marketplaceOrder.deleteMany();
  await prisma.marketplaceListing.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.deliveryJob.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.rFQ.deleteMany();
  await prisma.nurseTask.deleteMany();
  await prisma.attendanceLog.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.licenseRecord.deleteMany();
  await prisma.employeeBranch.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.patientUser.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.labResult.deleteMany();
  await prisma.labSpecimen.deleteMany();
  await prisma.order.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.department.deleteMany();
  await prisma.tenant.deleteMany();

  // 2. TENANT & BRANCHES
  const tenant = await prisma.tenant.create({
    data: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Central Hospital (Main Branch)',
      status: 'ACTIVE',
    },
  });

  // 2B. PERMISSIONS
  console.log('🔑 Creating permissions...');
  const permissionNames = [
    'patient.view', 'encounter.update', 'patient.create',
    'queue.view', 'queue.manage',
    'lab.result.view',
    'inventory.stock.dispense', 'inventory.item.view', 'inventory.stock.receive',
    'billing.invoice.view',
    'order.create',
    'approval.request.view',
    'admin.role.change', 'admin.health.view', 'admin.user.view', 'admin.branch.view',
    'report.export',
    'audit.view', 'audit.self', 'audit.export',
    'compliance.audit.review',
    'it.system.view',
    'integration.view',
    'hr.employee.manage',
    'procurement.request.view', 'procurement.supplier.manage',
    'patient.self_service', 'patient.merge.request', 'patient.merge.approve',
    'marketplace.buyer', 'marketplace.supplier', 'marketplace.admin',
    'field_service.manage',
  ];
  const createdPermissions = await Promise.all(
    permissionNames.map(name =>
      prisma.permission.create({
        data: { name, tenantId: tenant.id, riskLevel: 'PRIVILEGED' },
      }),
    ),
  );
  console.log(`  ✅ ${createdPermissions.length} permissions created`);

  const branches = [
    { id: '00000000-0000-0000-0000-000000000010', name: 'Main Campus', code: 'MAIN' },
    { name: 'North Wing', code: 'NORTH' },
    { name: 'South Clinic', code: 'SOUTH' },
  ];
  const createdBranches = [];
  for (const b of branches) {
    const created = await prisma.branch.create({
      data: { ...b, tenantId: tenant.id },
    });
    createdBranches.push(created);
  }

  // 3. DEPARTMENTS
  const deptNames = ['Cardiology', 'Neurology', 'Pediatrics', 'Radiology', 'Pharmacy', 'Admin'];
  const createdDepts = await Promise.all(
    deptNames.map(name => prisma.department.create({
      data: { name, code: name.substring(0, 3).toUpperCase(), tenantId: tenant.id },
    }))
  );

  // 4. USERS & EMPLOYEES
  // 4. USERS & EMPLOYEES
  const staff = [
    { name: 'Admin User', email: 'admin@hospital.com', role: 'Super Admin', password: 'Admin@123', dept: 'Admin', branchIdx: 0 },
    { name: 'Dr. Alice Smith', email: 'alice.smith@stjude.med', role: 'Doctor', password: 'Admin@123', dept: 'Cardiology', branchIdx: 0 },
    { name: 'Dr. Bob Jones', email: 'bob.jones@stjude.med', role: 'Doctor', password: 'Admin@123', dept: 'Neurology', branchIdx: 1 },
    { name: 'Nurse Clara', email: 'clara.n@stjude.med', role: 'Nurse', password: 'Admin@123', dept: 'Pediatrics', branchIdx: 0 },
    { name: 'Nurse David', email: 'david.n@stjude.med', role: 'Nurse', password: 'Admin@123', dept: 'Radiology', branchIdx: 2 },
    { name: 'Cashier Eve', email: 'eve.c@stjude.med', role: 'Cashier', password: 'Admin@123', dept: 'Admin', branchIdx: 0 },
    
    // Playwright/Demo dropdown accounts
    { name: 'Branch Admin User', email: 'branch.admin@hospital.com', role: 'Branch Admin', password: 'Admin@123', dept: 'Admin', branchIdx: 0 },
    { name: 'Receptionist User', email: 'receptionist@hospital.com', role: 'Receptionist', password: 'Admin@123', dept: 'Admin', branchIdx: 0 },
    { name: 'Cashier Demo User', email: 'cashier@hospital.com', role: 'Cashier', password: 'Admin@123', dept: 'Admin', branchIdx: 0 },
    { name: 'Med Tech User', email: 'medtech@hospital.com', role: 'Med-Tech', password: 'Admin@123', dept: 'Radiology', branchIdx: 0 },
    { name: 'Doctor Demo User', email: 'doctor@hospital.com', role: 'Doctor', password: 'Admin@123', dept: 'Cardiology', branchIdx: 0 },
    { name: 'Pharmacist User', email: 'pharmacist@hospital.com', role: 'Pharmacist', password: 'Admin@123', dept: 'Pharmacy', branchIdx: 0 },
    { name: 'Nurse Demo User', email: 'nurse@hospital.com', role: 'Nurse', password: 'Admin@123', dept: 'Pediatrics', branchIdx: 0 },
    { name: 'Supplier User', email: 'supplier@hospital.com', role: 'Supplier', password: 'Admin@123', dept: 'Admin', branchIdx: 0 },
    { name: 'Procurement User', email: 'procurement@hospital.com', role: 'Procurement Officer', password: 'Admin@123', dept: 'Admin', branchIdx: 0 },
    { name: 'HR Staff User', email: 'hr@hospital.com', role: 'HR Staff', password: 'Admin@123', dept: 'Admin', branchIdx: 0 },
    { name: 'HR Manager User', email: 'hr.manager@hospital.com', role: 'HR Manager', password: 'Admin@123', dept: 'Admin', branchIdx: 0 },
    { name: 'IT Support User', email: 'it.support@hospital.com', role: 'IT Support', password: 'Admin@123', dept: 'Admin', branchIdx: 0 },
    { name: 'Compliance User', email: 'compliance@hospital.com', role: 'Compliance Officer', password: 'Admin@123', dept: 'Admin', branchIdx: 0 },
    { name: 'Field Tech User', email: 'field.tech@hospital.com', role: 'Field Technician', password: 'Admin@123', dept: 'Admin', branchIdx: 0 },
    { name: 'Marketplace Admin User', email: 'marketplace.admin@hospital.com', role: 'Marketplace Admin', password: 'Admin@123', dept: 'Admin', branchIdx: 0 }
  ];

  const createdEmployees = [];
  const createdUsers = [];
  for (const [staffIndex, s] of staff.entries()) {
    const passwordHash = await bcrypt.hash(s.password, 10);
    const user = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash,
        status: 'ACTIVE',
        tenantId: tenant.id,
      },
    });
    createdUsers.push({ user, roleName: s.role });

    const emp = await prisma.employee.create({
      data: {
        tenantId: tenant.id,
        branchId: createdBranches[s.branchIdx].id,
        userId: user.id,
        employeeNumber: `EMP-${String(staffIndex + 1).padStart(4, '0')}`,
        department: s.dept,
        position: s.role,
        hireDate: new Date('2023-01-01'),
        status: 'ACTIVE',
        firstName: s.name.split(' ')[0],
        lastName: s.name.split(' ').slice(1).join(' '),
        salary: 5000,
      },
    });
    createdEmployees.push(emp);

    // Map branch relation to ensure proper session resolution
    await prisma.userBranch.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        branchId: createdBranches[s.branchIdx].id,
        isActive: true,
      },
    });
  }

  // 4B. ROLES & PERMISSIONS
  console.log('🔐 Creating roles and assigning permissions...');

  const permissionMap = new Map<string, string>();
  const allPermissions = await prisma.permission.findMany({ where: { tenantId: tenant.id } });
  for (const p of allPermissions) {
    permissionMap.set(p.name, p.id);
  }

  // Define role->permission mappings
  const rolePermissions: Record<string, string[]> = {
    'Super Admin': allPermissions.map((p) => p.name),
    'Branch Admin': [
      'patient.view', 'patient.create', 'queue.view', 'queue.manage',
      'billing.invoice.view', 'inventory.item.view', 'inventory.stock.receive',
      'inventory.stock.dispense', 'order.create', 'approval.request.view',
      'admin.user.view', 'admin.branch.view', 'report.export', 'audit.view', 'audit.self',
      'hr.employee.manage', 'procurement.request.view'
    ],
    'Doctor': [
      'patient.view', 'encounter.update', 'patient.create',
      'queue.view', 'queue.manage', 'lab.result.view',
      'order.create', 'audit.self', 'billing.invoice.view',
      'inventory.item.view',
    ],
    'Nurse': [
      'patient.view', 'encounter.update', 'patient.create',
      'queue.view', 'queue.manage', 'lab.result.view',
      'order.create', 'audit.self', 'inventory.stock.dispense',
      'inventory.item.view',
    ],
    'Cashier': [
      'patient.view', 'queue.view', 'billing.invoice.view',
      'audit.self', 'inventory.item.view',
    ],
    'Receptionist': [
      'patient.view', 'queue.view', 'queue.manage'
    ],
    'Med-Tech': [
      'patient.view', 'lab.result.view', 'audit.self'
    ],
    'Pharmacist': [
      'patient.view', 'inventory.item.view', 'inventory.stock.dispense', 'audit.self'
    ],
    'Supplier': [
      'marketplace.supplier', 'audit.self'
    ],
    'Procurement Officer': [
      'procurement.request.view', 'procurement.supplier.manage', 'inventory.item.view', 'audit.self'
    ],
    'HR Staff': [
      'hr.employee.manage', 'audit.self'
    ],
    'HR Manager': [
      'hr.employee.manage', 'audit.self'
    ],
    'IT Support': [
      'it.system.view', 'audit.view', 'audit.self'
    ],
    'Compliance Officer': [
      'compliance.audit.review', 'audit.view', 'audit.self'
    ],
    'Field Technician': [
      'field_service.manage', 'audit.self'
    ],
    'Marketplace Admin': [
      'marketplace.admin', 'audit.self'
    ],
    'Patient': [
      'patient.self_service', 'audit.self'
    ]
  };

  for (const [roleName, permNames] of Object.entries(rolePermissions)) {
    // Upsert the role
    const role = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: roleName } },
      update: { status: 'ACTIVE' },
      create: {
        tenantId: tenant.id,
        name: roleName,
        status: 'ACTIVE',
        isSystem: roleName === 'Super Admin',
      },
    });

    // Assign permissions to the role
    for (const permName of permNames) {
      const permId = permissionMap.get(permName);
      if (!permId) {
        console.warn(`  ⚠️ Permission "${permName}" not found, skipping`);
        continue;
      }
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permId },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permId,
        },
      });
    }

    console.log(`  ✅ Role "${roleName}" ready with ${permNames.length} permissions`);
  }

  // 4C. ASSIGN ROLES TO USERS
  console.log('👥 Assigning roles to users...');
  for (const { user, roleName } of createdUsers) {
    const role = await prisma.role.findFirst({
      where: { tenantId: tenant.id, name: roleName },
    });
    if (!role) {
      console.warn(`  ⚠️ Role "${roleName}" not found for user ${user.email}, skipping`);
      continue;
    }
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: { status: 'ACTIVE' },
      create: {
        userId: user.id,
        roleId: role.id,
        status: 'ACTIVE',
      },
    });
    console.log(`  ✅ ${user.email} → ${roleName}`);
  }

  // Create multi-branch user specifically for E2E branch-selection tests
  const multiBranchUserEmail = 'branch.multi@hospital.com';
  const multiBranchPasswordHash = await bcrypt.hash('Admin@123', 10);
  const multiUser = await prisma.user.create({
    data: {
      email: multiBranchUserEmail,
      passwordHash: multiBranchPasswordHash,
      status: 'ACTIVE',
      tenantId: tenant.id,
    },
  });
  const branchAdminRoleObj = await prisma.role.findFirst({
    where: { tenantId: tenant.id, name: 'Branch Admin' },
  });
  if (branchAdminRoleObj) {
    await prisma.userRole.create({
      data: {
        userId: multiUser.id,
        roleId: branchAdminRoleObj.id,
        status: 'ACTIVE',
      },
    });
  }
  await prisma.userBranch.create({
    data: {
      tenantId: tenant.id,
      userId: multiUser.id,
      branchId: createdBranches[0].id,
      isActive: true,
    },
  });
  await prisma.userBranch.create({
    data: {
      tenantId: tenant.id,
      userId: multiUser.id,
      branchId: createdBranches[1].id,
      isActive: true,
    },
  });
  console.log(`  ✅ Multi-branch user "${multiBranchUserEmail}" created with Branch Admin role`);

  // 5. PATIENTS
  const patients = [];
  for (let i = 1; i <= 30; i++) {
    const p = await prisma.patient.create({
      data: {
        tenantId: tenant.id,
        patientNumber: `PAT-${1000 + i}`,
        firstName: `Patient ${i}`,
        lastName: `Lastname ${i}`,
        dob: new Date(1960 + (i % 40), i % 12, (i % 27) + 1),
        status: 'ACTIVE',
      },
    });
    patients.push(p);
  }

  // Seed PatientUser for patient@hospital.com
  const patientEmail = 'patient@hospital.com';
  const patientPasswordHash = await bcrypt.hash('Admin@123', 10);
  if (patients.length > 0) {
    await prisma.patientUser.create({
      data: {
        tenantId: tenant.id,
        patientId: patients[0].id,
        email: patientEmail,
        passwordHash: patientPasswordHash,
        status: 'ACTIVE',
      },
    });
    console.log(`  ✅ PatientUser "${patientEmail}" linked to Patient "${patients[0].patientNumber}"`);
  }

  // 6. CLINICAL FLOW: Orders -> Results
  for (let i = 0; i < 15; i++) {
    const patient = patients[i];
    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        patientId: patient.id,
        branchId: createdBranches[0].id,
        orderNumber: `ORD-${2000 + i}`,
        status: i % 3 === 0 ? 'COMPLETED' : 'PENDING',
        createdAt: new Date(),
      },
    });

    if (order.status === 'COMPLETED') {
      await prisma.labResult.create({
        data: {
          tenantId: tenant.id,
          orderId: order.id,
          status: i % 2 === 0 ? 'RELEASED' : 'APPROVED',
          results: { glucose: 110, cholesterol: 200 },
          remarks: 'Patient stable',
          encodedById: createdEmployees[3].id,
          encodedAt: new Date(),
          validatedById: createdEmployees[1].id,
          validatedAt: new Date(),
          releasedAt: i % 2 === 0 ? new Date() : null,
          releasedById: createdEmployees[1].id,
          isCritical: i === 0, // Make first one critical
          criticalStatus: i === 0 ? 'OPEN' : undefined,
        },
      });
    }
  }

  // 7. QUEUE
  for (let i = 0; i < 10; i++) {
    await prisma.queueEntry.create({
      data: {
        tenantId: tenant.id,
        branchId: createdBranches[0].id,
        patientName: `Patient ${i + 1}`,
        patientId: patients[i]?.id,
        queueNumber: `Q-${100 + i}`,
        serviceType: i % 2 === 0 ? 'DOCTOR' : 'LABORATORY',
        status: i % 2 === 0 ? 'SERVING' : 'WAITING',
        category: i % 3 === 0 ? 'EMERGENCY' : 'REGULAR',
        createdAt: new Date(Date.now() - i * 3600000),
      },
    });
  }

  // 8. HR: Attendance & Licenses
  for (const [employeeIndex, emp] of createdEmployees.entries()) {
    // 30 days of attendance
    for (let d = 30; d > 0; d--) {
      await prisma.attendanceLog.create({
        data: {
          tenantId: tenant.id,
          branchId: emp.branchId,
          employeeId: emp.id,
          date: new Date(Date.now() - d * 86400000),
          checkIn: new Date(Date.now() - d * 86400000),
        },
      });
    }

    // A license that's expiring
    await prisma.licenseRecord.create({
      data: {
        tenantId: tenant.id,
        employeeId: emp.id,
        licenseType: 'Board Certification',
        licenseNumber: `LIC-${String(employeeIndex + 1).padStart(5, '0')}`,
        issuedAt: new Date('2022-01-01'),
        expiresAt: new Date(Date.now() + 15 * 86400000), // 15 days from now
        status: 'ACTIVE',
      },
    });
  }

  // 9. MARKETPLACE
  const supplier = await prisma.supplier.create({
    data: {
      tenantId: tenant.id,
      name: 'Global Med Supplies',
      contactEmail: 'sales@globalmed.com',
      status: 'ACTIVE',
    },
  });

  // Create a service category + item for marketplace listings
  const serviceCategory = await prisma.serviceCategory.create({
    data: {
      tenantId: tenant.id,
      name: 'Medical Equipment',
      createdBy: createdEmployees[0].userId || '',
      updatedBy: createdEmployees[0].userId || '',
    },
  });
  const serviceItem = await prisma.serviceItem.create({
    data: {
      tenantId: tenant.id,
      categoryId: serviceCategory.id,
      code: 'MRI-COIL',
      name: 'High-Res MRI Coil',
      createdBy: createdEmployees[0].userId || '',
      updatedBy: createdEmployees[0].userId || '',
    },
  });

  const listings = [
    { name: 'High-Res MRI Coil', price: 15000, stock: 5 },
    { name: 'Surgical Glove Box', price: 25, stock: 1000 },
    { name: 'COVID-19 Vaccine', price: 450, stock: 200 },
  ];

  for (const l of listings) {
    await prisma.marketplaceListing.create({
      data: {
        tenantId: tenant.id,
        serviceItemId: serviceItem.id,
        supplierId: supplier.id,
        name: l.name,
        basePrice: l.price,
        stockCount: l.stock,
        status: ListingStatus.APPROVED,
      },
    });
  }

  console.log('✅ Database successfully seeded with realistic data!');
  process.exit(0);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
