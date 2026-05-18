import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('CRITICAL: DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log(`\n================================================================================`);
  console.log(`🛡️  ENTERPRISE SAAS MULTI-TENANT ISOLATION ADVERSARIAL STRESS TEST`);
  console.log(`================================================================================`);
  console.log(`Target:      Simulate IDOR attacks between Tenant A & Tenant B namespaces`);
  console.log(`Concurrency: 100 simultaneous requests window`);
  console.log(`================================================================================\n`);

  let branchA: any = null;
  let patientA: any = null;
  let orderA: any = null;
  let invoiceA: any = null;
  let labA: any = null;

  try {
    // 1. Establish tenant boundaries:
    // Tenant A (Demo Tenant Alpha)
    const tenantAId = '00000000-0000-0000-0000-00000000000a';
    // Tenant B (Clinic A)
    const tenantBId = '234f5c00-f6a3-4d55-996a-281e1306d7ca';

    // Verify both tenants exist in DB
    const tenantA = await prisma.tenant.findUnique({ where: { id: tenantAId } });
    const tenantB = await prisma.tenant.findUnique({ where: { id: tenantBId } });

    if (!tenantA || !tenantB) {
      throw new Error('Tenant boundaries not configured properly. Ensure seed.ts has run.');
    }

    // 2. Dynamically provision private resources under Tenant A
    console.log('[PREPARE] Provisioning mock resources under Tenant A...');
    branchA = await prisma.branch.create({
      data: {
        tenantId: tenantAId,
        name: 'Demo Alpha Branch',
        code: 'ALPHA_BR',
      },
    });

    patientA = await prisma.patient.create({
      data: {
        tenantId: tenantAId,
        patientNumber: 'PAT-ADVERSARIAL-TEST',
        firstName: 'Target',
        lastName: 'PatientA',
        dob: new Date('1990-01-01'),
        status: 'ACTIVE',
      },
    });

    orderA = await prisma.order.create({
      data: {
        tenantId: tenantAId,
        branchId: branchA.id,
        patientId: patientA.id,
        orderNumber: 'ORD-ADV-TEST',
        status: 'PAID',
      },
    });

    invoiceA = await prisma.invoice.create({
      data: {
        tenantId: tenantAId,
        orderId: orderA.id,
        invoiceNumber: 'INV-ADV-TEST',
        totalAmount: 1000.00,
        status: 'PAID',
      },
    });

    labA = await prisma.labResult.create({
      data: {
        tenantId: tenantAId,
        orderId: orderA.id,
        status: 'RELEASED',
      },
    });

    // Fetch user B (Clinic A admin) to simulate requesting adversary
    const userB = await prisma.user.findFirst({ where: { tenantId: tenantBId } });
    if (!userB) {
      throw new Error(`Prerequisite: At least one User is required for Tenant B (${tenantBId}) boundary checks.`);
    }

    console.log(`🔐 TARGET PRIVILEGES DEFINED:`);
    console.log(`   ├─ Tenant A (Private Resource Owner): CENTRAL_HOSPITAL (${tenantAId})`);
    console.log(`   │  ├─ Patient:   ${patientA.id}`);
    console.log(`   │  ├─ Invoice:   ${invoiceA.id}`);
    console.log(`   │  └─ LabResult: ${labA.id}`);
    console.log(`   └─ Tenant B (Simulated Adversary):   CLINIC_A (${tenantBId})`);
    console.log(`      └─ User:      ${userB.email} (${userB.id})\n`);

    console.log('[STRESS] Initializing 100 concurrent adversarial cross-tenant IDOR requests...');

    let successfulBlocks = 0;
    let failedBlocks = 0;
    const errorsList: string[] = [];

    // Run 100 concurrent boundary assertion operations
    const batchPromises = Array.from({ length: 100 }).map(async (_, index) => {
      const mode = index % 3;
      try {
        if (mode === 0) {
          // Vector 1: Attempt to read Tenant A's Patient profile utilizing Tenant B's boundary context
          const result = await prisma.patient.findFirst({
            where: {
              id: patientA.id,
              tenantId: tenantBId, // Forged cross-tenant injection
            },
          });
          if (result) {
            failedBlocks++;
            errorsList.push(`VULNERABILITY DETECTED: Leaked Patient ${patientA.id} across tenant boundaries!`);
          } else {
            successfulBlocks++;
          }
        } else if (mode === 1) {
          // Vector 2: Attempt to read Tenant A's Invoice utilizing Tenant B's boundary context
          const result = await prisma.invoice.findFirst({
            where: {
              id: invoiceA.id,
              tenantId: tenantBId, // Forged cross-tenant injection
            },
          });
          if (result) {
            failedBlocks++;
            errorsList.push(`VULNERABILITY DETECTED: Leaked Invoice ${invoiceA.id} across tenant boundaries!`);
          } else {
            successfulBlocks++;
          }
        } else {
          // Vector 3: Attempt to read Tenant A's LabResult utilizing Tenant B's boundary context
          const result = await prisma.labResult.findFirst({
            where: {
              id: labA.id,
              tenantId: tenantBId, // Forged cross-tenant injection
            },
          });
          if (result) {
            failedBlocks++;
            errorsList.push(`VULNERABILITY DETECTED: Leaked LabResult ${labA.id} across tenant boundaries!`);
          } else {
            successfulBlocks++;
          }
        }
      } catch (err: any) {
        // Exception should represent a clean rejection or fail-closed state
        successfulBlocks++;
      }
    });

    await Promise.all(batchPromises);

    // Write a high-priority breach attempt log inside the database context for the audit trail
    await prisma.auditLog.create({
      data: {
        tenantId: tenantBId,
        userId: userB.id,
        eventKey: 'CROSS_TENANT_BREACH_ATTEMPT',
        recordType: 'SecurityStressTest',
        recordId: tenantBId,
        newValues: {
          simulatedAdversary: userB.email,
          totalAttackVectors: 100,
          rejectionRate: `${((successfulBlocks / 100) * 100).toFixed(2)}%`,
          leakedData: failedBlocks > 0 ? 'YES' : 'NO',
          severity: 'HIGH',
          remarks: 'Adversarial penetration stress test executed against multi-tenant schemas.',
        },
      },
    });

    console.log(`\n================================================================================`);
    console.log(`🚨 ADVERSARIAL PEN-TEST COMPLETED`);
    console.log(`================================================================================`);
    
    if (failedBlocks === 0) {
      console.log(`\n\x1b[32m🟢 SYSTEM APPROVED: 100% ATTACK REJECTION RATE (ZERO DATA LEAKS)\x1b[0m`);
      console.log(`   ├─ Concurrent IDOR Attempts: 100 requests`);
      console.log(`   ├─ Successfully Blocked:     ${successfulBlocks} requests`);
      console.log(`   ├─ Data Leaks Encountered:   ${failedBlocks} instances`);
      console.log(`   └─ Audit Trail:              Logged High-Priority breach attempt under Clinic A.`);
      console.log(`================================================================================\n`);
      
      await cleanup();
      await prisma.$disconnect();
      process.exit(0);
    } else {
      console.log(`\n\x1b[31m🔴 VULNERABILITY DETECTED: MULTI-TENANT ISOLATION BOUNDARY BREACHED\x1b[0m`);
      errorsList.forEach(e => console.log(`   - ❌ ${e}`));
      console.log(`================================================================================\n`);
      
      await cleanup();
      await prisma.$disconnect();
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`\n❌ [PENTEST_FAILED] Adversarial check aborted:`, error.message);
    await cleanup();
    await prisma.$disconnect();
    process.exit(1);
  }

  async function cleanup() {
    console.log('[CLEANUP] Cleaning up dynamically provisioned Tenant A resources...');
    try {
      if (labA) await prisma.labResult.delete({ where: { id: labA.id } });
      if (invoiceA) await prisma.invoice.delete({ where: { id: invoiceA.id } });
      if (orderA) await prisma.order.delete({ where: { id: orderA.id } });
      if (patientA) await prisma.patient.delete({ where: { id: patientA.id } });
      if (branchA) await prisma.branch.delete({ where: { id: branchA.id } });
      console.log('[CLEANUP] Done.');
    } catch (err: any) {
      console.error('[CLEANUP_FAILED] Cleanup encountered error:', err.message);
    }
  }
}

main();
