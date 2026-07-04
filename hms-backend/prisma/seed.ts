import { PrismaClient, ListingStatus, OrderStatus, ShipmentStatus, DeliveryJobStatus, TaskStatus } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting System-Wide Real-Data Seeding...');

  // 1. CLEANUP: Start fresh
  console.log('🧹 Cleaning database...');
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
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.department.deleteMany();
  await prisma.tenant.deleteMany();

  // 2. TENANT & BRANCHES
  const tenant = await prisma.tenant.create({
    data: {
      name: 'St. Jude Medical Center',
      status: 'ACTIVE',
    },
  });

  const branches = [
    { name: 'Main Campus', code: 'MAIN' },
    { name: 'North Wing', code: 'NORTH' },
    { name: 'South Clinic', code: 'SOUTH' },
  ].map(async (b) => {
    return prisma.branch.create({
      data: { ...b, tenantId: tenant.id },
    });
  });
  const createdBranches = await Promise.all(branches);

  // 3. DEPARTMENTS
  const deptNames = ['Cardiology', 'Neurology', 'Pediatrics', 'Radiology', 'Pharmacy', 'Admin'];
  const createdDepts = await Promise.all(
    deptNames.map(name => prisma.department.create({
      data: { name, code: name.substring(0, 3).toUpperCase(), tenantId: tenant.id },
    }))
  );

  // 4. USERS & EMPLOYEES
  const staff = [
    { name: 'Admin User', email: 'admin@stjude.med', role: 'Super Admin', dept: 'Admin', branchIdx: 0 },
    { name: 'Dr. Alice Smith', email: 'alice.smith@stjude.med', role: 'Doctor', dept: 'Cardiology', branchIdx: 0 },
    { name: 'Dr. Bob Jones', email: 'bob.jones@stjude.med', role: 'Doctor', dept: 'Neurology', branchIdx: 1 },
    { name: 'Nurse Clara', email: 'clara.n@stjude.med', role: 'Nurse', dept: 'Pediatrics', branchIdx: 0 },
    { name: 'Nurse David', email: 'david.n@stjude.med', role: 'Nurse', dept: 'Radiology', branchIdx: 2 },
    { name: 'Cashier Eve', email: 'eve.c@stjude.med', role: 'Cashier', dept: 'Admin', branchIdx: 0 },
  ];

  const createdEmployees = [];
  for (const s of staff) {
    const user = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
        tenantId: tenant.id,
      },
    });

    const emp = await prisma.employee.create({
      data: {
        tenantId: tenant.id,
        branchId: createdBranches[s.branchIdx].id,
        userId: user.id,
        employeeNumber: `EMP-${crypto.randomInt(1000, 9999)}`,
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
  }

  // 5. PATIENTS
  const patients = [];
  for (let i = 1; i <= 30; i++) {
    const p = await prisma.patient.create({
      data: {
        tenantId: tenant.id,
        patientNumber: `PAT-${1000 + i}`,
        firstName: `Patient ${i}`,
        lastName: `Lastname ${i}`,
        dob: new Date(1960 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
        status: 'ACTIVE',
      },
    });
    patients.push(p);
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
  for (const emp of createdEmployees) {
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
        licenseNumber: `LIC-${crypto.randomInt(10000, 99999)}`,
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
