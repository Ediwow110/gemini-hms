import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@prisma/client';
import * as crypto from 'crypto';

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag: string): string => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : '';
  };

  const tenantId = getArg('--tenantId') || '234f5c00-f6a3-4d55-996a-281e1306d7ca';
  const startDateStr = getArg('--startDate') || '2026-05-18';
  const endDateStr = getArg('--endDate') || '2026-05-31';

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('CRITICAL: DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log(`\n================================================================================`);
  console.log(`📊 CORPORATE ANALYTICS COMPILER (LOCK-FREE)`);
  console.log(`================================================================================`);
  console.log(`Tenant ID:   ${tenantId}`);
  console.log(`Time Range:  ${startDateStr} -> ${endDateStr}`);
  console.log(`================================================================================\n`);

  try {
    const startDate = new Date(`${startDateStr}T00:00:00.000Z`);
    const endDate = new Date(`${endDateStr}T23:59:59.999Z`);

    // 1. Fetch user to stamp requestedBy
    const adminUser = await prisma.user.findFirst({ where: { tenantId } });
    if (!adminUser) throw new Error('No user context found under this isolated tenant.');

    // 2. Force uncommitted read hints/isolated read-only transaction execution block
    const reportData = await prisma.$transaction(async (tx) => {
      // Set session read-only transaction characteristic inside PG to ensure contention-free execution
      await tx.$executeRawUnsafe('SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED');

      // A. Financial Aggregates
      const invoices = await tx.invoice.findMany({
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate },
        },
      });

      const payments = await tx.payment.findMany({
        where: {
          tenantId,
          status: 'POSTED',
          createdAt: { gte: startDate, lte: endDate },
        },
      });

      const closedSessions = await tx.cashierSession.findMany({
        where: {
          tenantId,
          status: 'CLOSED',
          closedAt: { gte: startDate, lte: endDate },
        },
        include: {
          payments: {
            where: { status: 'POSTED' },
          },
        },
      });

      let totalDrawerVariance = 0.00;
      for (const session of closedSessions) {
        const opening = Number(session.openingBalance);
        const closing = Number(session.closingBalance || 0);
        const sumPayments = session.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const expected = opening + sumPayments;
        totalDrawerVariance += Math.abs(closing - expected);
      }

      const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
      const totalPaid = payments.reduce((sum, pay) => sum + Number(pay.amount), 0);

      // B. LIS Turnaround Velocity (turnaround between created and released in status RELEASED)
      const releasedLabs = await tx.labResult.findMany({
        where: {
          tenantId,
          status: 'RELEASED',
          updatedAt: { gte: startDate, lte: endDate },
        },
      });

      let totalTurnaroundMs = 0;
      let countLabsWithTurnaround = 0;

      for (const lab of releasedLabs) {
        const start = lab.createdAt.getTime();
        const end = lab.updatedAt.getTime();
        const diff = end - start;
        if (diff > 0) {
          totalTurnaroundMs += diff;
          countLabsWithTurnaround++;
        }
      }

      const avgTurnaroundMin = countLabsWithTurnaround > 0 
        ? (totalTurnaroundMs / countLabsWithTurnaround) / 60000 
        : 0.0;

      return {
        totalInvoicesCount: invoices.length,
        totalInvoicedAmount: totalInvoiced,
        totalPaymentsCount: payments.length,
        totalPaidAmount: totalPaid,
        totalDrawerVariance,
        totalLabsReleased: releasedLabs.length,
        averageTurnaroundMinutes: avgTurnaroundMin,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadUncommitted,
    });

    // 3. Generate unique payload checksum signature
    const payloadStr = JSON.stringify(reportData);
    const checksum = crypto.createHash('sha256').update(payloadStr).digest('hex');

    // 4. Stamping Audit Trial into ReportExport
    const exportLog = await prisma.reportExport.create({
      data: {
        tenantId,
        reportType: 'CORPORATE_ANALYTICS',
        filters: { startDate: startDateStr, endDate: endDateStr } as any,
        reason: 'Phase 1 Exit Corporate Compliance Compiled',
        rowCount: 1,
        status: 'APPROVED',
        riskLevel: 'HIGH',
        format: 'JSON',
        requestedFields: ['totalInvoiced', 'totalPaid', 'drawerVariance', 'labTurnaround'] as any,
        requestedBy: adminUser.id,
        checksum,
        completedAt: new Date(),
      },
    });

    console.log(`\x1b[32m🟢 REPORT MATRIX COMPILED SUCCESSFULLY (NOLOCK)\x1b[0m`);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`💼 FINANCIAL STREAM ANALYSIS:`);
    console.log(`   ├─ Invoices Count:       ${reportData.totalInvoicesCount}`);
    console.log(`   ├─ Total Gross Invoiced: ₱${reportData.totalInvoicedAmount.toFixed(2)}`);
    console.log(`   ├─ Payments Logged:      ${reportData.totalPaymentsCount}`);
    console.log(`   ├─ Total Cash Received:  ₱${reportData.totalPaidAmount.toFixed(2)}`);
    console.log(`   └─ Drawer Cash Variance: ₱${reportData.totalDrawerVariance.toFixed(2)}`);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`🧪 LIS VELOCITY METRICS:`);
    console.log(`   ├─ Lab Results Released: ${reportData.totalLabsReleased}`);
    console.log(`   └─ Avg Turnaround Time:  ${reportData.averageTurnaroundMinutes.toFixed(2)} minutes`);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`🔑 EXPORT COMPLIANCE CHECKSUM:`);
    console.log(`   ├─ Record ID:            ${exportLog.id}`);
    console.log(`   ├─ Requested By:         ${adminUser.email}`);
    console.log(`   └─ Payload SHA256:       ${checksum}`);
    console.log(`================================================================================\n`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error(`\n❌ [ANALYTICS_FAILED] Compiler swept aborted:`, error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
