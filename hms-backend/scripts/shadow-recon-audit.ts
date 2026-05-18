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
  let dateStr = getArg('--date');

  if (!tenantId || !branchId) {
    console.error('Usage: npx tsx scripts/shadow-recon-audit.ts --tenantId <UUID> --branchId <UUID> [--date YYYY-MM-DD]');
    process.exit(1);
  }

  // Default to today if date is not provided
  if (!dateStr) {
    const today = new Date();
    dateStr = today.toISOString().split('T')[0];
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('CRITICAL: DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Validate that the tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      console.error(`\n❌ [RECON_ERROR] Closed-fail condition met: Tenant ID "${tenantId}" does not exist in the database.`);
      await prisma.$disconnect();
      process.exit(1);
    }

    // 2. Validate branch exists under this tenant
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, tenantId },
    });

    if (!branch) {
      console.error(`\n❌ [RECON_ERROR] Closed-fail condition met: Branch ID "${branchId}" does not exist or is not associated with Tenant ID "${tenantId}".`);
      await prisma.$disconnect();
      process.exit(1);
    }

    // Parse the date boundaries in UTC/Local alignment
    const startDate = new Date(`${dateStr}T00:00:00.000Z`);
    const endDate = new Date(`${dateStr}T23:59:59.999Z`);

    console.log(`\n================================================================================`);
    console.log(`🏥 SHADOW OPERATION RECONCILIATION & VARIANCE AUDIT ENGINE`);
    console.log(`================================================================================`);
    console.log(`Tenant:      ${tenant.name} (${tenant.id})`);
    console.log(`Branch:      ${branch.name} (${branch.id})`);
    console.log(`Audit Date:  ${dateStr}`);
    console.log(`Range Bounds: [${startDate.toISOString()} -> ${endDate.toISOString()}]`);
    console.log(`================================================================================\n`);

    // A. INTAKE FOOTPRINT
    const newPatientsCount = await prisma.patient.count({
      where: {
        tenantId,
        deletedAt: null,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    // B. CLINICAL WORKLIST FOOTPRINT
    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        branchId,
        deletedAt: null,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { status: true },
    });

    const orderStatuses: Record<string, number> = {};
    for (const o of orders) {
      orderStatuses[o.status] = (orderStatuses[o.status] || 0) + 1;
    }

    // C. LIS DIAGNOSTIC FOOTPRINT
    const labResults = await prisma.labResult.findMany({
      where: {
        tenantId,
        order: { branchId },
        deletedAt: null,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { status: true },
    });

    const labStatuses: Record<string, number> = {};
    for (const lr of labResults) {
      labStatuses[lr.status] = (labStatuses[lr.status] || 0) + 1;
    }

    // D. FINANCIAL REVENUE LEDGER SUMMARY
    // Invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        order: { branchId },
        deletedAt: null,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { totalAmount: true },
    });

    const totalInvoicesValue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

    // Payments
    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        cashierSession: { branchId },
        deletedAt: null,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { amount: true, status: true },
    });

    const totalPaymentsValue = payments
      .filter((p) => p.status === 'POSTED')
      .reduce((sum, pay) => sum + Number(pay.amount), 0);

    // Cashier Sessions & Variances
    const closedSessions = await prisma.cashierSession.findMany({
      where: {
        tenantId,
        branchId,
        status: 'CLOSED',
        closedAt: { gte: startDate, lte: endDate },
      },
      include: {
        payments: {
          include: {
            reversals: {
              where: { status: 'APPLIED' },
            },
          },
        },
      },
    });

    const variancesList: { sessionId: string; user: string; expected: number; actual: number; variance: number }[] = [];

    for (const session of closedSessions) {
      const cashPayments = session.payments
        .filter((p) => p.paymentMethod === 'CASH' && p.status === 'POSTED')
        .reduce((sum, p) => {
          const paymentAmount = Number(p.amount);
          const refunds = p.reversals
            .filter((r) => r.type === 'REFUND')
            .reduce((rSum, r) => rSum + Number(r.amount), 0);
          return sum + (paymentAmount - refunds);
        }, 0);

      const expectedCash = Number(session.openingBalance) + cashPayments;
      const actualCash = Number(session.closingBalance || 0);
      const varianceVal = actualCash - expectedCash;

      variancesList.push({
        sessionId: session.id,
        user: session.userId,
        expected: expectedCash,
        actual: actualCash,
        variance: varianceVal,
      });
    }

    // E. VISUAL GRID CONSOLE LAYOUT
    console.log(`📊 [1. OPERATIONAL VOLUMETRICS]`);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`Intake:            +${newPatientsCount} Patient Profiles Registered`);
    console.log(`Orders Generated:   ${orders.length} total orders`);
    if (orders.length > 0) {
      for (const [status, count] of Object.entries(orderStatuses)) {
        console.log(`  └─ [${status}]: ${count}`);
      }
    } else {
      console.log(`  └─ No active orders generated today.`);
    }

    console.log(`\n🧪 [2. DIAGNOSTIC WORKLIST]`);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`Lab Results:       ${labResults.length} total sheets initialized`);
    if (labResults.length > 0) {
      for (const [status, count] of Object.entries(labStatuses)) {
        console.log(`  └─ [${status}]: ${count}`);
      }
    } else {
      console.log(`  └─ No diagnostic sessions processed today.`);
    }

    console.log(`\n💰 [3. REVENUE LEDGER & BALANCE AUDIT]`);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`Invoices Issued:   ₱${totalInvoicesValue.toFixed(2)}`);
    console.log(`Payments Received: ₱${totalPaymentsValue.toFixed(2)}`);
    console.log(`Closed Sessions:   ${closedSessions.length} closed cash sessions`);
    
    if (closedSessions.length > 0) {
      console.log(`\n🔑 [4. CASHIER DRAWER VARIANCE DETECTOR]`);
      console.log(`--------------------------------------------------------------------------------`);
      console.log(String('SESSION ID').padEnd(38) + ' | ' + String('EXPECTED').padEnd(12) + ' | ' + String('ACTUAL').padEnd(12) + ' | ' + String('VARIANCE').padEnd(10));
      console.log(`--------------------------------------------------------------------------------`);
      for (const v of variancesList) {
        const varSign = v.variance > 0 ? `+₱${v.variance.toFixed(2)}` : (v.variance < 0 ? `-₱${Math.abs(v.variance).toFixed(2)}` : `₱0.00`);
        console.log(`${v.sessionId} | ₱${v.expected.toFixed(2).padEnd(10)} | ₱${v.actual.toFixed(2).padEnd(10)} | ${varSign}`);
      }
      console.log(`--------------------------------------------------------------------------------`);
    } else {
      console.log(`\n  └─ No closed cashier drawer sessions to audit on this date.`);
    }

    console.log(`\n================================================================================`);
    console.log(`✅ [AUDIT_COMPLETE] EOD variance evaluation executed successfully.`);
    console.log(`================================================================================\n`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error(`\n❌ [AUDIT_ABORTED] Critical exception during telemetry compilation:`, error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
