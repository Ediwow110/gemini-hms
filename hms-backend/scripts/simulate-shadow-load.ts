import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag: string): string => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : '';
  };

  const tenantId = getArg('--tenantId');
  const branchId = getArg('--branchId');
  const dateStr = getArg('--date');

  if (!tenantId || !branchId || !dateStr) {
    console.error('Usage: npx tsx scripts/simulate-shadow-load.ts --tenantId <UUID> --branchId <UUID> --date YYYY-MM-DD');
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

  console.log(`[SIMULATE] Initializing High-Density Shadow Simulation for date ${dateStr}...`);

  try {
    // 1. Fetch Tenant & Branch
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error(`Tenant ${tenantId} not found.`);

    const branch = await prisma.branch.findFirst({ where: { id: branchId, tenantId } });
    if (!branch) throw new Error(`Branch ${branchId} not found.`);

    // 2. Fetch admin user of this tenant to assign creator/updater tags
    const adminUser = await prisma.user.findFirst({ where: { tenantId } });
    if (!adminUser) throw new Error(`No user found for Tenant ${tenantId}. Seed the tenant first.`);

    // 3. Pre-seed service category and diagnostic items if they do not exist
    const category = await prisma.serviceCategory.create({
      data: {
        tenantId,
        name: 'DIAGNOSTICS',
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });

    const cbcItem = await prisma.serviceItem.create({
      data: {
        tenantId,
        categoryId: category.id,
        code: 'LAB-CBC',
        name: 'Complete Blood Count',
        isActive: true,
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });
    await prisma.servicePrice.create({
      data: {
        tenantId,
        serviceItemId: cbcItem.id,
        branchId,
        amount: 350.00,
        isActive: true,
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });

    const urinalysisItem = await prisma.serviceItem.create({
      data: {
        tenantId,
        categoryId: category.id,
        code: 'LAB-UA',
        name: 'Routine Urinalysis',
        isActive: true,
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });
    await prisma.servicePrice.create({
      data: {
        tenantId,
        serviceItemId: urinalysisItem.id,
        branchId,
        amount: 200.00,
        isActive: true,
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });

    const xrayItem = await prisma.serviceItem.create({
      data: {
        tenantId,
        categoryId: category.id,
        code: 'RAD-CXRAY',
        name: 'Chest X-Ray PA View',
        isActive: true,
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });
    await prisma.servicePrice.create({
      data: {
        tenantId,
        serviceItemId: xrayItem.id,
        branchId,
        amount: 650.00,
        isActive: true,
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      },
    });

    const servicePool = [
      { id: cbcItem.id, name: 'Complete Blood Count', price: 350.00 },
      { id: urinalysisItem.id, name: 'Routine Urinalysis', price: 200.00 },
      { id: xrayItem.id, name: 'Chest X-Ray PA View', price: 650.00 }
    ];

    // 4. Create CashierSession
    const session = await prisma.cashierSession.create({
      data: {
        tenantId,
        branchId,
        userId: adminUser.id,
        openingBalance: 1000.00,
        status: 'OPEN',
        openedAt: new Date(`${dateStr}T08:00:00.000Z`),
      },
    });
    console.log(`[SIMULATE] Initialized CashierSession: ${session.id}`);

    // Mock names pool for clean, self-contained mock patients
    const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'James', 'Jessica', 'Robert', 'Karen', 'William', 'Linda', 'Thomas', 'Barbara', 'Richard'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez'];

    // 5. Patient Intake Stream (15 distinct Patient profiles)
    const patients = [];
    for (let i = 1; i <= 15; i++) {
      const pNum = `PAT-${100000 + i}`;
      const fName = firstNames[(i - 1) % firstNames.length];
      const lName = lastNames[(i - 1) % lastNames.length];
      const dob = new Date(`19${70 + (i % 25)}-0${(i % 9) + 1}-1${(i % 8) + 1}`);
      
      const pat = await prisma.patient.create({
        data: {
          tenantId,
          patientNumber: pNum,
          firstName: fName,
          lastName: lName,
          dob,
          status: 'ACTIVE',
          createdById: adminUser.id,
          updatedById: adminUser.id,
          createdAt: new Date(`${dateStr}T${String(8 + Math.floor(i / 2)).padStart(2, '0')}:${String(10 * (i % 6)).padStart(2, '0')}:00.000Z`),
        },
      });
      patients.push(pat);
    }
    console.log(`[SIMULATE] Registered ${patients.length} Patient profiles.`);

    // 6. Medical Order, Billing, and LIS Stream (12 Orders)
    const paidOrders = [];
    const pendingOrders = [];
    let invoiceCount = 1001;
    let receiptCount = 5001;

    for (let i = 0; i < 12; i++) {
      const patient = patients[i];
      const oNum = `ORD-${200000 + i}`;
      const isPaid = i < 9; // 9 PAID, 3 PENDING

      const selectedService = servicePool[i % servicePool.length];
      
      const order = await prisma.$transaction(async (tx) => {
        // Create Order
        const ord = await tx.order.create({
          data: {
            tenantId,
            branchId,
            patientId: patient.id,
            orderNumber: oNum,
            status: isPaid ? 'PAID' : 'PENDING',
            createdById: adminUser.id,
            updatedById: adminUser.id,
            createdAt: new Date(`${dateStr}T${String(9 + Math.floor(i / 2)).padStart(2, '0')}:${String(5 * i).padStart(2, '0')}:00.000Z`),
          },
        });

        // Create OrderItem
        await tx.orderItem.create({
          data: {
            tenantId,
            orderId: ord.id,
            itemType: 'SERVICE',
            itemId: selectedService.id,
            name: selectedService.name,
            quantity: 1,
            unitPrice: selectedService.price,
            lineTotal: selectedService.price,
            createdAt: ord.createdAt,
          },
        });

        // Create Invoice
        const inv = await tx.invoice.create({
          data: {
            tenantId,
            orderId: ord.id,
            invoiceNumber: `INV-${invoiceCount++}`,
            totalAmount: selectedService.price,
            paidAmount: isPaid ? selectedService.price : 0,
            status: isPaid ? 'PAID' : 'UNPAID',
            createdById: adminUser.id,
            updatedById: adminUser.id,
            createdAt: ord.createdAt,
          },
        });

        if (isPaid) {
          // Create Payment
          const pay = await tx.payment.create({
            data: {
              tenantId,
              invoiceId: inv.id,
              cashierSessionId: session.id,
              receiptNumber: `REC-${receiptCount++}`,
              amount: selectedService.price,
              paymentMethod: 'CASH',
              status: 'POSTED',
              idempotencyKey: `IDEM-${ord.id}`,
              createdById: adminUser.id,
              updatedById: adminUser.id,
              createdAt: ord.createdAt,
            },
          });

          // Create CashierLedgerEntry
          await tx.cashierLedgerEntry.create({
            data: {
              cashierSessionId: session.id,
              type: 'PAYMENT',
              amount: selectedService.price,
              referenceId: pay.id,
              createdAt: ord.createdAt,
            },
          });
        }

        return ord;
      });

      if (isPaid) {
        paidOrders.push(order);
      } else {
        pendingOrders.push(order);
      }
    }
    console.log(`[SIMULATE] Generated ${paidOrders.length} PAID and ${pendingOrders.length} PENDING orders & invoices.`);

    // 7. LIS Diagnostic Stream (9 LabResults: 6 RELEASED, 3 DRAFT)
    let releasedCount = 0;
    let draftCount = 0;

    for (let i = 0; i < paidOrders.length; i++) {
      const order = paidOrders[i];
      const isReleased = i < 6; // 6 RELEASED, 3 DRAFT

      await prisma.labResult.create({
        data: {
          tenantId,
          orderId: order.id,
          status: isReleased ? 'RELEASED' : 'PENDING_COLLECTION',
          results: { result: 'Negative' },
          remarks: 'Diagnostic sweep clean.',
          approvedById: isReleased ? adminUser.id : null,
          lockedAt: isReleased ? new Date(`${dateStr}T16:00:00.000Z`) : null,
          createdById: adminUser.id,
          updatedById: adminUser.id,
          createdAt: order.createdAt,
        },
      });

      if (isReleased) releasedCount++;
      else draftCount++;
    }
    console.log(`[SIMULATE] Generated ${releasedCount} RELEASED and ${draftCount} DRAFT LIS lab results.`);

    // 8. Intentional Variance Injection (₱350 shortage)
    const cashierPayments = await prisma.payment.findMany({
      where: { cashierSessionId: session.id, status: 'POSTED', paymentMethod: 'CASH' },
    });

    const sumPayments = cashierPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const expectedCash = 1000.00 + sumPayments;
    
    // Inject exact ₱350 shortage variance
    const closingBalance = expectedCash - 350.00;
    const variance = -350.00;

    await prisma.cashierSession.update({
      where: { id: session.id },
      data: {
        status: 'CLOSED',
        closingBalance,
        closedAt: new Date(`${dateStr}T17:30:00.000Z`),
      },
    });

    // Write audit log entry detailing the exact shortage variance
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: adminUser.id,
        eventKey: 'SESSION_CLOSED',
        recordType: 'CashierSession',
        recordId: session.id,
        newValues: {
          expectedCash,
          actualCash: closingBalance,
          variance,
          remarks: 'Injecting ₱350.00 drawer shortage discrepancy for cross-verification validation.',
        },
        createdAt: new Date(`${dateStr}T17:30:00.000Z`),
      },
    });

    console.log(`[SIMULATE] Successfully closed CashierSession with injected ₱350.00 Shortage Variance.`);
    console.log(`- Expected Ending Cash: ₱${expectedCash.toFixed(2)}`);
    console.log(`- Actual Closing Cash:   ₱${closingBalance.toFixed(2)}`);
    console.log(`- Injected Variance:    ₱${variance.toFixed(2)}`);

    console.log(`\n🎉 [SIMULATE_SUCCESS] High-density single-day operational load snapshot completed!`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error(`\n❌ [SIMULATE_FAILED] Data population aborted:`, error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
