import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
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
  console.log(`🟢 PHASE 1 EXIT GATEWAY & SLO VERIFICATION ENGINE`);
  console.log(`================================================================================`);
  console.log(`Tenant ID:   ${tenantId}`);
  console.log(`Time Window: ${startDateStr} 00:00:00 UTC -> ${endDateStr} 23:59:59 UTC`);
  console.log(`================================================================================\n`);

  try {
    const startDate = new Date(`${startDateStr}T00:00:00.000Z`);
    const endDate = new Date(`${endDateStr}T23:59:59.999Z`);

    // Verify Tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error(`Tenant "${tenantId}" not found.`);

    // ============================================================================
    // CRITERION A: Availability SLO Gate
    // ============================================================================
    console.log('[EVALUATE] Checking Criterion A: The Availability SLO Gate...');
    const allLogs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const totalRequests = allLogs.length;
    // Count HTTP 5xx errors (e.g. eventKey containing HTTP_5 or similar API failure markers)
    const errLogs = allLogs.filter(log => 
      log.eventKey.startsWith('HTTP_5') || 
      log.eventKey.includes('500_ERROR') || 
      log.eventKey === 'HTTP_SERVER_ERROR'
    );
    const serverErrors = errLogs.length;

    let availability = 1.0; // Default to 100% if no logs exist
    if (totalRequests > 0) {
      availability = (totalRequests - serverErrors) / totalRequests;
    }

    const availPercent = availability * 100;
    const isAvailOk = availPercent >= 99.5;
    console.log(`  ├─ Total Requests Evaluated: ${totalRequests}`);
    console.log(`  ├─ HTTP 5xx Server Errors:   ${serverErrors}`);
    console.log(`  ├─ Calculated Availability:  ${availPercent.toFixed(4)}%`);
    console.log(`  └─ SLO Threshold (>= 99.5%): ${isAvailOk ? '✅ PASSED' : '❌ FAILED'}`);

    // ============================================================================
    // CRITERION B: Financial Drawer Variance Gate
    // ============================================================================
    console.log('\n[EVALUATE] Checking Criterion B: The Financial Drawer Variance Gate...');
    const closedSessions = await prisma.cashierSession.findMany({
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

    let totalVariance = 0.00;
    const sessionDetails: any[] = [];

    for (const session of closedSessions) {
      const opening = Number(session.openingBalance);
      const closing = Number(session.closingBalance || 0);
      const sumPayments = session.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const expected = opening + sumPayments;
      const variance = closing - expected;
      totalVariance += Math.abs(variance);

      sessionDetails.push({
        id: session.id,
        expected: expected.toFixed(2),
        actual: closing.toFixed(2),
        variance: variance.toFixed(2),
      });
    }

    const isVarianceOk = totalVariance === 0.00;
    console.log(`  ├─ Closed Sessions Audited:  ${closedSessions.length}`);
    console.log(`  ├─ Total Absolute Variance:  ₱${totalVariance.toFixed(2)}`);
    console.log(`  └─ Gate Requirement (₱0.00):  ${isVarianceOk ? '✅ PASSED' : '❌ FAILED'}`);

    // ============================================================================
    // CRITERION C: Clinical Data Integrity Gate
    // ============================================================================
    console.log('\n[EVALUATE] Checking Criterion C: Clinical Data Integrity Gate...');
    const paidOrders = await prisma.order.findMany({
      where: {
        tenantId,
        status: 'PAID',
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        invoice: true,
        labResult: {
          include: {
            signature: true,
          },
        },
        items: true,
      },
    });

    let clinicalIntegrityOk = true;
    let checkedPaidOrders = 0;
    const errorsList: string[] = [];

    for (const order of paidOrders) {
      checkedPaidOrders++;
      // Verify Invoice exists
      if (!order.invoice) {
        clinicalIntegrityOk = false;
        errorsList.push(`Order ${order.orderNumber} is PAID but has no linked invoice.`);
        continue;
      }

      // Verify signed LabResult if it has lab items
      const hasLabItems = order.items.some(item => item.itemId && (item.name.toUpperCase().includes('CBC') || item.name.toUpperCase().includes('LAB')));
      if (hasLabItems) {
        if (!order.labResult) {
          clinicalIntegrityOk = false;
          errorsList.push(`Order ${order.orderNumber} contains lab items but has no matching LabResult sheet.`);
        } else if (order.labResult.status !== 'RELEASED') {
          clinicalIntegrityOk = false;
          errorsList.push(`Order ${order.orderNumber} lab sheet status is "${order.labResult.status}" instead of RELEASED.`);
        } else if (!order.labResult.signature) {
          clinicalIntegrityOk = false;
          errorsList.push(`Order ${order.orderNumber} lab sheet is released but missing doctor signature.`);
        }
      }
    }

    console.log(`  ├─ Paid Orders Evaluated:   ${checkedPaidOrders}`);
    console.log(`  ├─ Integrity Violations:    ${errorsList.length}`);
    if (errorsList.length > 0) {
      errorsList.forEach(e => console.log(`  │  ├─ ❌ ${e}`));
    }
    console.log(`  └─ Gate Requirement (100%): ${clinicalIntegrityOk ? '✅ PASSED' : '❌ FAILED'}`);

    // ============================================================================
    // GO/NO-GO ENFORCEMENT DECISION
    // ============================================================================
    console.log('\n================================================================================');
    console.log('🚨 FINAL GATEWAY COMPLIANCE VERDICT');
    console.log('================================================================================');

    if (isAvailOk && isVarianceOk && clinicalIntegrityOk) {
      console.log(`\n\x1b[32m🟢 SYSTEM APPROVED FOR PHASE 2 LIMITED PRODUCTION\x1b[0m`);
      
      // Append an immutable entry to AuditLog logging the signed Compliance Certificate
      const certPayload = {
        tenantId,
        startDate: startDateStr,
        endDate: endDateStr,
        availability: `${availPercent.toFixed(4)}%`,
        variance: `₱${totalVariance.toFixed(2)}`,
        clinicalDataIntegrity: '100% VALID',
        timestamp: new Date().toISOString(),
      };

      const certToken = crypto
        .createHmac('sha256', 'phase2-secret-salt-key')
        .update(JSON.stringify(certPayload))
        .digest('hex');

      const adminUser = await prisma.user.findFirst({ where: { tenantId } });
      const creatorId = adminUser ? adminUser.id : '00000000-0000-0000-0000-000000000000';

      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: creatorId,
          eventKey: 'COMPLIANCE_CERTIFICATE_SIGNED',
          recordType: 'Tenant',
          recordId: tenantId,
          newValues: {
            ...certPayload,
            certificateToken: certToken,
            verdict: 'APPROVED_FOR_PHASE_2',
          },
        },
      });

      console.log(`\n🔑 compliance certificate successfully signed & persisted in Tenant Audit Trail:`);
      console.log(`   └─ TOKEN: ${certToken}`);
      console.log(`================================================================================\n`);
      
      await prisma.$disconnect();
      process.exit(0);
    } else {
      console.log(`\n\x1b[31m🔴 GATEWAY BLOCKED: PHASE 1 COMPLIANCE CONDITIONS UNMET\x1b[0m`);
      console.log(`   └─ Reasons:`);
      if (!isAvailOk) console.log(`      - Availability SLO of 99.5% not met (Got ${availPercent.toFixed(4)}%).`);
      if (!isVarianceOk) console.log(`      - Cashier drawer variance is ₱${totalVariance.toFixed(2)} instead of ₱0.00.`);
      if (!clinicalIntegrityOk) console.log(`      - Clinical data integrity violations detected in database orders.`);
      console.log(`================================================================================\n`);
      
      await prisma.$disconnect();
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`\n❌ [GATEWAY_FAILED] Compliance evaluation aborted:`, error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
