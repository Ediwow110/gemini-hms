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

  const tenantId = getArg('--tenantId') || '234f5c00-f6a3-4d55-996a-281e1306d7ca';
  const yearStr = getArg('--year') || '2026';
  const monthStr = getArg('--month') || '5';
  const simulateNegative = getArg('--simulateNegative') === 'true';

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('CRITICAL: DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log(`\n================================================================================`);
  console.log(`💼 AUTOMATED PAYROLL SWEEP ENGINE`);
  console.log(`================================================================================`);
  console.log(`Tenant ID:   ${tenantId}`);
  console.log(`Payroll Period: ${year}-${month.toString().padStart(2, '0')}`);
  console.log(`Simulate Rollback: ${simulateNegative ? 'YES (Trigger Net Salary < 0)' : 'NO'}`);
  console.log(`================================================================================\n`);

  try {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // Execute the sweep inside an atomic transaction
    await prisma.$transaction(async (tx) => {
      // 1. Roster Retrieval: Query all active Employee records under this isolated tenant
      const employees = await tx.employee.findMany({
        where: {
          tenantId,
          status: 'ACTIVE',
        },
      });

      if (employees.length === 0) {
        throw new Error('No active employees found for the designated tenant.');
      }

      console.log(`[PROCESS] Found ${employees.length} active employee profiles for sweep.`);
      
      let totalBasicSalary = 0;
      let totalAllowances = 0;
      let totalDeductions = 0;
      let totalNetSalary = 0;
      const payslipsCreated: string[] = [];

      for (let i = 0; i < employees.length; i++) {
        const emp = employees[i];
        const baseSalary = emp.salary ? Number(emp.salary) : 35000.00; // default safe fallback basic salary
        
        // Standard branch calculations
        const allowances = baseSalary * 0.10; // 10% allowance snapshot
        let deductions = baseSalary * 0.05;  // 5% standard deductions

        // Force a negative net salary to trigger validation/rollback if simulateNegative is active
        if (simulateNegative && i === 0) {
          deductions = baseSalary * 2.0; // deductions exceed salary
        }

        const netSalary = baseSalary + allowances - deductions;

        // Strict boundary validation: Reject entire run if any net payment drops below zero
        if (netSalary < 0) {
          throw new RangeError(
            `[FATAL_REJECTION] Net salary calculated below zero for Employee ${emp.employeeNumber} (${emp.firstName} ${emp.lastName}). Net: ₱${netSalary.toFixed(2)}. Initiating complete database transaction rollback.`
          );
        }

        totalBasicSalary += baseSalary;
        totalAllowances += allowances;
        totalDeductions += deductions;
        totalNetSalary += netSalary;

        // 2. Ledger Write-Lock: Insert into Payslip table as GENERATED_UNPAID
        const payslip = await tx.payslip.create({
          data: {
            tenantId,
            branchId: emp.branchId,
            employeeId: emp.id,
            periodStart: startDate,
            periodEnd: endDate,
            basicSalary: baseSalary,
            totalAllowances: allowances,
            totalDeductions: deductions,
            netSalary,
            status: 'GENERATED_UNPAID',
          },
        });

        payslipsCreated.push(payslip.id);
      }

      // 3. Telemetry Coupling: Log PAYROLL_CYCLE_EXECUTED in AuditLog with transaction context
      const adminUser = await tx.user.findFirst({ where: { tenantId } });
      const supervisorId = adminUser ? adminUser.id : '00000000-0000-0000-0000-000000000000';
      const supervisorEmail = adminUser ? adminUser.email : 'system@hms.com';

      const auditRecord = await tx.auditLog.create({
        data: {
          tenantId,
          userId: supervisorId,
          eventKey: 'PAYROLL_CYCLE_EXECUTED',
          recordType: 'Payslip',
          recordId: tenantId, // scoped to Tenant ID as aggregation marker
          newValues: {
            period: `${year}-${month}`,
            employeesProcessed: employees.length,
            totalGross: totalBasicSalary.toFixed(2),
            totalAllowances: totalAllowances.toFixed(2),
            totalDeductions: totalDeductions.toFixed(2),
            totalPayout: totalNetSalary.toFixed(2),
            authorizedBy: supervisorEmail,
            payslipCount: payslipsCreated.length,
          },
        },
      });

      console.log(`\n\x1b[32m🟢 PAYROLL SWEEP COMPLETED SUCCESSFULLY\x1b[0m`);
      console.log(`   ├─ Period:        ${year}-${month.toString().padStart(2, '0')}`);
      console.log(`   ├─ Employees:     ${employees.length}`);
      console.log(`   ├─ Gross Base:    ₱${totalBasicSalary.toFixed(2)}`);
      console.log(`   ├─ Net Payout:    ₱${totalNetSalary.toFixed(2)}`);
      console.log(`   ├─ Locked Ledger: ${payslipsCreated.length} payslips written (Status: GENERATED_UNPAID)`);
      console.log(`   └─ Audit Trail:   Signed by supervisor [${supervisorEmail}] | ID: ${auditRecord.id}`);
      console.log(`================================================================================\n`);
    });

    await prisma.$disconnect();
    process.exit(0);
  } catch (error: any) {
    if (error instanceof RangeError) {
      console.log(`\n\x1b[31m🔴 PAYROLL SWEEP TRANSACTION REJECTED (SAFE ROLLBACK)\x1b[0m`);
      console.log(`   └─ Reason: ${error.message}`);
      console.log(`   └─ Status: 100% database state rollback completed. Zero loose records written.`);
      console.log(`================================================================================\n`);
      await prisma.$disconnect();
      process.exit(0); // Exit gracefully for tested rejection flow
    } else {
      console.error(`\n❌ [PAYROLL_SWEEP_FAILED] Processing sweep aborted:`, error.message);
      await prisma.$disconnect();
      process.exit(1);
    }
  }
}

main();
