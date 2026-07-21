import {
  EncounterStatus,
  ListingStatus,
  PrescriptionStatus,
  PrismaClient,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import {
  AUTHORIZATION_PERMISSIONS,
  SYSTEM_ROLE_PERMISSIONS,
} from '../src/auth/authorization-catalog';
import { validateDemoEnvironment } from '../scripts/demo-safety-guard';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://hms_local_user:hms_secure_pass@localhost:5432/gemini_hms_local?schema=public',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  validateDemoEnvironment({ isDestructive: true });
  console.log('🚀 Starting deterministic synthetic dashboard seeding...');

  // 1. SAFETY: Seeding owns data creation only. The guarded reset wrapper owns
  // destructive schema reset, which avoids brittle model-by-model deletion and
  // restrictive-foreign-key failures when demo workflows created extra records.
  const existingTenantCount = await prisma.tenant.count();
  if (existingTenantCount > 0) {
    throw new Error(
      'Synthetic seed requires an empty database. Run npm run db:reset:demo:safe ' +
        'with the demo safety confirmation instead of invoking the seed directly.',
    );
  }

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
  const createdPermissions = await Promise.all(
    AUTHORIZATION_PERMISSIONS.map((definition) =>
      prisma.permission.create({
        data: {
          ...definition,
          tenantId: tenant.id,
        },
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
  const rolePermissions = SYSTEM_ROLE_PERMISSIONS;

  for (const [roleName, permNames] of Object.entries(rolePermissions)) {
    // Upsert the role
    const role = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: roleName } },
      update: {
        status: 'ACTIVE',
        isSystem: true,
        archivedAt: null,
        archivedReason: null,
      },
      create: {
        tenantId: tenant.id,
        name: roleName,
        status: 'ACTIVE',
        isSystem: true,
      },
    });

    const canonicalPermissionIds = permNames
      .map((permName) => permissionMap.get(permName))
      .filter((permissionId): permissionId is string => Boolean(permissionId));

    await prisma.rolePermission.deleteMany({
      where: {
        roleId: role.id,
        permissionId: { notIn: canonicalPermissionIds },
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
        firstName: `[SYNTHETIC] Patient ${i}`,
        lastName: `Demo ${i}`,
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

  // 6. CLINICAL + FINANCIAL FLOW
  // Synthetic dates are distributed so dashboards show meaningful trends.
  const doctorUser = createdUsers.find((entry) => entry.roleName === 'Doctor')?.user;
  const cashierUser = createdUsers.find((entry) => entry.roleName === 'Cashier')?.user;
  if (!doctorUser || !cashierUser) {
    throw new Error('Synthetic Doctor and Cashier users are required for dashboard seeding.');
  }

  const cashierSession = await prisma.cashierSession.create({
    data: {
      tenantId: tenant.id,
      branchId: createdBranches[0].id,
      userId: cashierUser.id,
      status: 'OPEN',
      openingBalance: 5000,
      openedAt: new Date(Date.now() - 7 * 86400000),
    },
  });

  const encounters = [];
  for (let i = 0; i < 24; i++) {
    const occurredAt = new Date(Date.now() - (23 - i) * 86400000 - (i % 5) * 3600000);
    const encounter = await prisma.encounter.create({
      data: {
        tenantId: tenant.id,
        branchId: createdBranches[i % createdBranches.length].id,
        patientId: patients[i % patients.length].id,
        attendingId: doctorUser.id,
        doctorId: doctorUser.id,
        encounteredAt: occurredAt,
        startedAt: occurredAt,
        endedAt: i % 4 === 0 ? new Date(occurredAt.getTime() + 55 * 60000) : null,
        chiefComplaint: ['Routine follow-up', 'Fever and cough', 'Medication review', 'Diagnostic workup'][i % 4],
        reason: 'Synthetic dashboard scenario',
        status: i % 4 === 0 ? EncounterStatus.FINISHED : EncounterStatus.OPEN,
        type: ['OUTPATIENT', 'EMERGENCY', 'OUTPATIENT', 'TELEHEALTH'][i % 4],
        createdBy: doctorUser.id,
        updatedBy: doctorUser.id,
        createdAt: occurredAt,
      },
    });
    encounters.push(encounter);
  }

  for (let i = 0; i < 15; i++) {
    const patient = patients[i];
    const occurredAt = new Date(Date.now() - (14 - i) * 86400000);
    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        patientId: patient.id,
        branchId: createdBranches[0].id,
        encounterId: encounters[i].id,
        orderNumber: `ORD-${2000 + i}`,
        orderType: i % 2 === 0 ? 'LAB' : 'CONSULTATION',
        priority: i % 5 === 0 ? 'URGENT' : 'ROUTINE',
        clinicalIndication: 'Synthetic dashboard scenario',
        requestedById: doctorUser.id,
        requestedAt: occurredAt,
        status: i % 3 === 0 ? 'COMPLETED' : 'PENDING',
        createdById: doctorUser.id,
        updatedById: doctorUser.id,
        createdAt: occurredAt,
      },
    });

    const totalAmount = 1800 + (i % 5) * 650;
    const paymentAmount = i < 10 ? totalAmount : i < 13 ? Math.round(totalAmount * 0.45) : 0;
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        orderId: order.id,
        invoiceNumber: `INV-DEMO-${String(i + 1).padStart(4, '0')}`,
        totalAmount,
        paidAmount: paymentAmount,
        status: paymentAmount === totalAmount ? 'PAID' : paymentAmount > 0 ? 'PARTIAL' : 'UNPAID',
        createdById: cashierUser.id,
        updatedById: cashierUser.id,
        createdAt: occurredAt,
      },
    });

    if (paymentAmount > 0) {
      const payment = await prisma.payment.create({
        data: {
          tenantId: tenant.id,
          branchId: createdBranches[0].id,
          invoiceId: invoice.id,
          cashierSessionId: cashierSession.id,
          receiptNumber: `RCT-DEMO-${String(i + 1).padStart(4, '0')}`,
          amount: paymentAmount,
          paymentMethod: ['CASH', 'CARD', 'HMO', 'BANK_TRANSFER'][i % 4],
          status: 'POSTED',
          idempotencyKey: `demo-payment-${i + 1}`,
          createdById: cashierUser.id,
          updatedById: cashierUser.id,
          createdAt: new Date(Math.max(occurredAt.getTime(), Date.now() - 6 * 86400000 + i * 1800000)),
        },
      });
      await prisma.cashierLedgerEntry.create({
        data: {
          tenantId: tenant.id,
          cashierSessionId: cashierSession.id,
          type: 'PAYMENT',
          amount: paymentAmount,
          referenceId: payment.id,
          createdAt: payment.createdAt,
        },
      });
    }

    if (order.status === 'COMPLETED') {
      await prisma.labResult.create({
        data: {
          tenantId: tenant.id,
          orderId: order.id,
          status: i % 2 === 0 ? 'RELEASED' : 'APPROVED',
          results: { glucose: 92 + i, cholesterol: 168 + i * 3 },
          remarks: 'Synthetic result for dashboard and portal review',
          encodedById: createdEmployees[3].id,
          encodedAt: occurredAt,
          validatedById: createdEmployees[1].id,
          validatedAt: new Date(occurredAt.getTime() + 3600000),
          releasedAt: i % 2 === 0 ? new Date(occurredAt.getTime() + 7200000) : null,
          releasedById: createdEmployees[1].id,
          lockedAt: i % 2 === 0 ? new Date(occurredAt.getTime() + 7200000) : null,
          isCritical: i === 0,
          criticalStatus: i === 0 ? 'OPEN' : undefined,
        },
      });
    }

    if (i < 8) {
      await prisma.prescription.create({
        data: {
          tenantId: tenant.id,
          branchId: createdBranches[0].id,
          encounterId: encounters[i].id,
          prescribedById: doctorUser.id,
          patientId: patient.id,
          medicationName: ['Amoxicillin', 'Losartan', 'Metformin', 'Paracetamol'][i % 4],
          dosage: ['500 mg', '50 mg', '500 mg', '500 mg'][i % 4],
          frequency: ['Every 8 hours', 'Once daily', 'Twice daily', 'As needed'][i % 4],
          duration: ['7 days', '30 days', '30 days', '5 days'][i % 4],
          notes: 'Synthetic prescription for portal review',
          status: i < 6 ? PrescriptionStatus.ACTIVE : PrescriptionStatus.DISPENSED,
          createdById: doctorUser.id,
          updatedById: doctorUser.id,
          createdAt: occurredAt,
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

  const createdListings = [];
  for (const l of listings) {
    const listing = await prisma.marketplaceListing.create({
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
    createdListings.push(listing);
  }

  const marketplaceBuyer = createdUsers.find((entry) => entry.roleName === 'Branch Admin')?.user ?? createdUsers[0].user;
  for (let i = 0; i < 18; i++) {
    const listing = createdListings[i % createdListings.length];
    const quantity = 1 + (i % 4);
    const unitPrice = Number(listing.basePrice);
    const subtotal = quantity * unitPrice;
    const order = await prisma.marketplaceOrder.create({
      data: {
        tenantId: tenant.id,
        buyerId: marketplaceBuyer.id,
        totalAmount: subtotal,
        status: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED'][i % 4],
        paymentStatus: i % 4 === 0 ? 'UNPAID' : 'PAID',
        createdAt: new Date(Date.now() - (17 - i) * 86400000),
      },
    });
    await prisma.marketplaceOrderItem.create({
      data: {
        orderId: order.id,
        listingId: listing.id,
        quantity,
        unitPrice,
        subtotal,
      },
    });
  }

  console.log('✅ Database successfully seeded with realistic synthetic data!');
  process.exit(0);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
