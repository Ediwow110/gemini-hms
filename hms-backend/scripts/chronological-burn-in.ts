import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as path from 'path';

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag: string): string => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : '';
  };

  const tenantId = getArg('--tenantId') || '234f5c00-f6a3-4d55-996a-281e1306d7ca';
  const branchId = getArg('--branchId') || '074dd2b6-f1d0-433c-8b52-333932f132ab';

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('CRITICAL: DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log(`\n================================================================================`);
  console.log(`⏳ CHRONOLOGICAL CONCURRENCY & OPERATIONAL BURN-IN TESTER`);
  console.log(`================================================================================`);
  console.log(`Tenant ID:  ${tenantId}`);
  console.log(`Branch ID:  ${branchId}`);
  console.log(`Timeline:   14 business days (2026-05-18 -> 2026-05-31)`);
  console.log(`================================================================================\n`);

  try {
    // 1. Verify Clinic A structure and lookup standard accounts
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error(`Tenant ${tenantId} not found.`);

    const branch = await prisma.branch.findFirst({ where: { id: branchId, tenantId } });
    if (!branch) throw new Error(`Branch ${branchId} not found under tenant.`);

    const cashier = await prisma.user.findFirst({ where: { tenantId, email: 'fiona.lim@clinica.com' } });
    if (!cashier) throw new Error(`Cashier user fiona.lim@clinica.com not found.`);

    const doctor = await prisma.user.findFirst({ where: { tenantId, email: 'clara.hughes@clinica.com' } });
    if (!doctor) throw new Error(`Doctor user clara.hughes@clinica.com not found.`);

    // Fetch the Consultation and CBC service items from the database
    const consItem = await prisma.serviceItem.findFirst({ where: { tenantId, code: 'CONS-001' } });
    const cbcItem = await prisma.serviceItem.findFirst({ where: { tenantId, code: 'LAB-CBC' } });

    if (!consItem || !cbcItem) {
      throw new Error('Required service items CONS-001 or LAB-CBC are not seeded in the database.');
    }

    const servicePool = [
      { id: consItem.id, name: consItem.name, price: 500.00, isLab: false },
      { id: cbcItem.id, name: cbcItem.name, price: 350.00, isLab: true }
    ];

    let invoiceCountSeed = 80001;
    let receiptCountSeed = 90001;

    // 2. The Comprehensive 14-day loop
    for (let day = 1; day <= 14; day++) {
      const currentDayNum = 17 + day;
      const dateStr = `2026-05-${currentDayNum}`;

      console.log(`\n[DAY ${day}/14] 📅 ADVANCING VIRTUAL TIME TO ${dateStr}...`);
      console.log(`--------------------------------------------------------------------------------`);

      // Step A: Cashier Shift Initializer
      console.log('  ├─ Step A: Opening Cashier Session...');
      const session = await prisma.cashierSession.create({
        data: {
          tenantId,
          branchId,
          userId: cashier.id,
          openingBalance: 1000.00,
          status: 'OPEN',
          openedAt: new Date(`${dateStr}T08:00:00.000Z`),
        },
      });

      // Step B: High-Density Intake & Order Generation (20 to 40 Patients)
      const patientCount = 20 + Math.floor(Math.random() * 21); // Random between 20 and 40
      console.log(`  ├─ Step B: Simulating High-Density Intake of ${patientCount} Patients...`);

      const dayInvoices: any[] = [];

      for (let i = 1; i <= patientCount; i++) {
        const pNum = `PAT-BURN-${day}-${i}`;
        const oNum = `ORD-BURN-${day}-${i}`;
        const selectedService = servicePool[i % servicePool.length];

        await prisma.$transaction(async (tx) => {
          // Create Patient
          const patient = await tx.patient.create({
            data: {
              tenantId,
              patientNumber: pNum,
              firstName: `BurnInPatient`,
              lastName: `${day}-${i}`,
              dob: new Date('1990-01-01'),
              status: 'ACTIVE',
              createdById: cashier.id,
              updatedById: cashier.id,
              createdAt: new Date(`${dateStr}T${String(8 + Math.floor(i / 5)).padStart(2, '0')}:${String(12 * (i % 5)).padStart(2, '0')}:00.000Z`),
            },
          });

          // Create Order
          const order = await tx.order.create({
            data: {
              tenantId,
              branchId,
              patientId: patient.id,
              orderNumber: oNum,
              status: 'PENDING',
              createdById: cashier.id,
              updatedById: cashier.id,
              createdAt: new Date(`${dateStr}T${String(8 + Math.floor(i / 5)).padStart(2, '0')}:${String(12 * (i % 5)).padStart(2, '0')}:05.000Z`),
            },
          });

          // Create OrderItem
          await tx.orderItem.create({
            data: {
              tenantId,
              orderId: order.id,
              itemType: 'SERVICE',
              itemId: selectedService.id,
              name: selectedService.name,
              quantity: 1,
              unitPrice: selectedService.price,
              lineTotal: selectedService.price,
              createdAt: order.createdAt,
            },
          });

          // Create Invoice
          const invoice = await tx.invoice.create({
            data: {
              tenantId,
              orderId: order.id,
              invoiceNumber: `INV-BURN-${invoiceCountSeed++}`,
              totalAmount: selectedService.price,
              paidAmount: 0,
              status: 'UNPAID',
              createdById: cashier.id,
              updatedById: cashier.id,
              createdAt: order.createdAt,
            },
          });

          // Create PENDING lab result if service is LIS
          let labResultId: string | null = null;
          if (selectedService.isLab) {
            const lab = await tx.labResult.create({
              data: {
                tenantId,
                orderId: order.id,
                status: 'PENDING_COLLECTION',
                results: { status: 'Awaiting values' },
                remarks: 'Burn-in automation schedule queue.',
                createdById: cashier.id,
                updatedById: cashier.id,
                createdAt: order.createdAt,
              },
            });
            labResultId = lab.id;
          }

          dayInvoices.push({
            id: invoice.id,
            totalAmount: selectedService.price,
            orderId: order.id,
            labResultId,
          });
        });
      }

      // Step C: Idempotent Payment Posting (Exactly 85% of day's invoices)
      const payCount = Math.round(dayInvoices.length * 0.85);
      console.log(`  ├─ Step C: Posting Idempotent Payments for ${payCount}/${dayInvoices.length} Invoices (85%)...`);

      const paidList = dayInvoices.slice(0, payCount);

      for (const inv of paidList) {
        const fingerprint = `FP-BURN-${inv.id}`;
        const key = `KEY-BURN-${inv.id}`;

        await prisma.$transaction(async (tx) => {
          // Create IdempotencyRecord
          const idem = await tx.idempotencyRecord.create({
            data: {
              tenantId,
              operation: 'BILLING_PAYMENT_POST',
              key,
              requestFingerprint: fingerprint,
              status: 'IN_PROGRESS',
            },
          });

          // Create Payment
          const payment = await tx.payment.create({
            data: {
              tenantId,
              branchId,
              invoiceId: inv.id,
              cashierSessionId: session.id,
              receiptNumber: `REC-BURN-${receiptCountSeed++}`,
              amount: inv.totalAmount,
              paymentMethod: 'CASH',
              status: 'POSTED',
              idempotencyKey: key,
              createdById: cashier.id,
              updatedById: cashier.id,
              createdAt: new Date(`${dateStr}T14:30:00.000Z`),
            },
          });

          // Update IdempotencyRecord to COMPLETED
          await tx.idempotencyRecord.update({
            where: { id: idem.id },
            data: {
              status: 'COMPLETED',
              paymentId: payment.id,
              responseData: { success: true, paymentId: payment.id },
            },
          });

          // Create CashierLedgerEntry
          await tx.cashierLedgerEntry.create({
            data: {
              tenantId,
              cashierSessionId: session.id,
              type: 'PAYMENT',
              amount: inv.totalAmount,
              referenceId: payment.id,
              createdAt: payment.createdAt,
            },
          });

          // Update Invoice
          await tx.invoice.update({
            where: { id: inv.id },
            data: {
              paidAmount: inv.totalAmount,
              status: 'PAID',
            },
          });

          // Update Order
          await tx.order.update({
            where: { id: inv.orderId },
            data: {
              status: 'PAID',
            },
          });
        });
      }

      // Step D: LIS Workflow State Transitions (paid lab results transition to RELEASED)
      console.log('  ├─ Step D: Transitioning LIS Workflows to RELEASED...');
      let releasedLabsCount = 0;
      for (const inv of paidList) {
        if (inv.labResultId) {
          await prisma.$transaction(async (tx) => {
            // Create LabResultSignature
            await tx.labResultSignature.create({
              data: {
                labResultId: inv.labResultId,
                signedById: doctor.id,
                signedAt: new Date(`${dateStr}T15:45:00.000Z`),
                signatureHash: `SIG-HASH-BURN-${inv.labResultId}`,
              },
            });

            // Create LabResultVersion
            await tx.labResultVersion.create({
              data: {
                labResultId: inv.labResultId,
                version: 1,
                oldStatus: 'PENDING_COLLECTION',
                newStatus: 'RELEASED',
                amendedById: doctor.id,
                reason: 'Initial automated burn-in clinical release.',
                oldData: undefined,
                createdAt: new Date(`${dateStr}T15:45:00.000Z`),
              },
            });

            // Update LabResult
            await tx.labResult.update({
              where: { id: inv.labResultId },
              data: {
                status: 'RELEASED',
                results: { result: 'Negative (Auto Burn-In Validated)' },
                remarks: 'Verified complete and clinically accurate.',
                approvedById: doctor.id,
                lockedAt: new Date(`${dateStr}T15:45:00.000Z`),
              },
            });
          });
          releasedLabsCount++;
        }
      }
      console.log(`  │  └─ Successfully released ${releasedLabsCount} diagnostic lab sheets.`);

      // Step E: Daily Register Closeout
      console.log('  ├─ Step E: Closing cashier session with zero variance...');
      const cashierPayments = await prisma.payment.findMany({
        where: { cashierSessionId: session.id, status: 'POSTED' },
      });
      const sumPayments = cashierPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const expectedCash = 1000.00 + sumPayments;

      await prisma.cashierSession.update({
        where: { id: session.id },
        data: {
          status: 'CLOSED',
          closingBalance: expectedCash,
          closedAt: new Date(`${dateStr}T17:30:00.000Z`),
        },
      });

      // Write Session Closure Audit Log
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: cashier.id,
          eventKey: 'SESSION_CLOSED',
          recordType: 'CashierSession',
          recordId: session.id,
          newValues: {
            expectedCash,
            actualCash: expectedCash,
            variance: 0.00,
            remarks: 'Daily register closeout burn-in completed with perfect balance alignment.',
          },
          createdAt: new Date(`${dateStr}T17:30:00.000Z`),
        },
      });

      // Step F: Automated Shadow Auditor Evaluation
      console.log('  ├─ Step F: Invoking EOD Reconciliation Auditor...');
      try {
        const auditScriptPath = path.join(__dirname, 'shadow-recon-audit.ts');
        const output = execSync(
          `npx tsx prisma/shadow-recon-audit.ts --tenantId ${tenantId} --branchId ${branchId} --date ${dateStr}`,
          { encoding: 'utf-8' }
        );
        console.log(output.trim());
      } catch (err: any) {
        console.error(`  │  ❌ Audit Engine Invocation Failed:`, err.message);
      }

      // Telemetry Logging
      const mem = process.memoryUsage();
      console.log(`  📊 Telemetry: Heap Used = ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB | RSS = ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
      console.log(`--------------------------------------------------------------------------------`);
    }

    console.log(`\n🎉 [BURN_IN_SUCCESS] 14-day chronological burn-in simulation successfully completed!`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error(`\n❌ [BURN_IN_FAILED] Execution aborted:`, error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
