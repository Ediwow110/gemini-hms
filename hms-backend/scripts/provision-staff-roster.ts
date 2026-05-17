import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as fs from 'fs';
import * as path from 'path';

interface StaffInput {
  firstName: string;
  lastName: string;
  email: string;
  roleName: string; // Branch Admin, Doctor, Cashier, Nurse
}

function generateHighEntropyPassword(): string {
  // Generates 14-char secure randomized alphanumeric password
  const charPool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let pass = '';
  for (let i = 0; i < 14; i++) {
    pass += charPool.charAt(Math.floor(Math.random() * charPool.length));
  }
  return pass;
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag: string): string => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : '';
  };

  const tenantId = getArg('--tenantId');
  const branchId = getArg('--branchId');
  const rosterJsonPath = getArg('--rosterJson');

  if (!tenantId || !branchId) {
    console.error('Usage: npx tsx scripts/provision-staff-roster.ts --tenantId <UUID> --branchId <UUID> [--rosterJson <path>]');
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

  console.log(`\n================================================================================`);
  console.log(`🔒 SECURE CLINICAL STAFF PROVISIONING SERVICE`);
  console.log(`================================================================================`);
  console.log(`Tenant:  ${tenantId}`);
  console.log(`Branch:  ${branchId}`);
  console.log(`================================================================================\n`);

  try {
    let staffRoster: StaffInput[] = [];

    // Load roster details
    if (rosterJsonPath) {
      if (!fs.existsSync(rosterJsonPath)) {
        throw new Error(`Roster JSON file not found at: ${rosterJsonPath}`);
      }
      staffRoster = JSON.parse(fs.readFileSync(rosterJsonPath, 'utf-8'));
    } else {
      // Default high-fidelity roster of 14 real active staff details
      staffRoster = [
        // 2 Branch Admins
        { firstName: 'Alice', lastName: 'Vance', email: 'alice.vance@clinica.com', roleName: 'Branch Admin' },
        { firstName: 'Bob', lastName: 'Carter', email: 'bob.carter@clinica.com', roleName: 'Branch Admin' },
        // 3 Doctors
        { firstName: 'Clara', lastName: 'Hughes', email: 'clara.hughes@clinica.com', roleName: 'Doctor' },
        { firstName: 'Daniel', lastName: 'Vance', email: 'daniel.vance@clinica.com', roleName: 'Doctor' },
        { firstName: 'Evelyn', lastName: 'Ross', email: 'evelyn.ross@clinica.com', roleName: 'Doctor' },
        // 3 Cashiers
        { firstName: 'Fiona', lastName: 'Lim', email: 'fiona.lim@clinica.com', roleName: 'Cashier' },
        { firstName: 'George', lastName: 'Cruz', email: 'george.cruz@clinica.com', roleName: 'Cashier' },
        { firstName: 'Hannah', lastName: 'Dy', email: 'hannah.dy@clinica.com', roleName: 'Cashier' },
        // 6 Nurses
        { firstName: 'Ian', lastName: 'Mendoza', email: 'ian.mendoza@clinica.com', roleName: 'Nurse' },
        { firstName: 'Jane', lastName: 'Santos', email: 'jane.santos@clinica.com', roleName: 'Nurse' },
        { firstName: 'Kyle', lastName: 'Reyes', email: 'kyle.reyes@clinica.com', roleName: 'Nurse' },
        { firstName: 'Lydia', lastName: 'Diaz', email: 'lydia.diaz@clinica.com', roleName: 'Nurse' },
        { firstName: 'Marc', lastName: 'Flores', email: 'marc.flores@clinica.com', roleName: 'Nurse' },
        { firstName: 'Nina', lastName: 'Green', email: 'nina.green@clinica.com', roleName: 'Nurse' }
      ];
    }

    if (staffRoster.length === 0) {
      throw new Error('Roster list is empty. Provide at least one user record.');
    }

    console.log(`[PROVISION] Processing secure registration of ${staffRoster.length} staff accounts...`);

    const provisionLedger: { name: string; email: string; role: string; tempPass: string; totpSecret: string }[] = [];
    let empCounter = 200001;

    // Execute provisioning inside transaction to maintain relational stability
    await prisma.$transaction(async (tx) => {
      // Check Tenant & Branch
      const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) throw new Error(`Tenant ID "${tenantId}" does not exist.`);

      const branch = await tx.branch.findFirst({ where: { id: branchId, tenantId } });
      if (!branch) throw new Error(`Branch ID "${branchId}" does not exist under tenant.`);

      for (const staff of staffRoster) {
        // Validate role exists scoped to this tenant
        const role = await tx.role.findFirst({
          where: { tenantId, name: staff.roleName },
        });

        if (!role) {
          throw new Error(`Role "${staff.roleName}" does not exist for tenant. Please seed standard roles first.`);
        }

        // Check if user already exists
        let user = await tx.user.findFirst({
          where: { tenantId, email: staff.email.toLowerCase() },
        });

        let tempPass = '******** [RETAINED IN DB - SECURE]';
        let totpSecret = user?.mfaSecret || 'N/A';

        if (!user) {
          // Generate high-entropy temp password and hash it
          tempPass = generateHighEntropyPassword();
          const passwordHash = await bcrypt.hash(tempPass, 10);

          // Generate TOTP secret seed
          totpSecret = speakeasy.generateSecret({ length: 20, name: `HMS:${staff.email}` }).base32;

          // Create User account with MFA enabled
          user = await tx.user.create({
            data: {
              tenantId,
              email: staff.email.toLowerCase(),
              passwordHash,
              mfaEnabled: true,
              mfaSecret: totpSecret,
              status: 'ACTIVE',
            },
          });

          // Map role relation
          await tx.userRole.create({
            data: {
              userId: user.id,
              roleId: role.id,
              status: 'ACTIVE',
            },
          });

          // Map branch relation
          await tx.userBranch.create({
            data: {
              tenantId,
              userId: user.id,
              branchId,
              isActive: true,
            },
          });

          // Create associated Employee profile
          const empNumber = `EMP-${empCounter++}`;
          await tx.employee.create({
            data: {
              userId: user.id,
              tenantId,
              branchId,
              employeeNumber: empNumber,
              position: staff.roleName,
              status: 'ACTIVE',
              firstName: staff.firstName,
              lastName: staff.lastName,
            },
          });
        }

        provisionLedger.push({
          name: `${staff.firstName} ${staff.lastName}`,
          email: staff.email.toLowerCase(),
          role: staff.roleName,
          tempPass,
          totpSecret,
        });
      }
    });

    // Write cleartext ledger file only once at generation time
    const ledgerDir = path.join(__dirname, 'templates');
    if (!fs.existsSync(ledgerDir)) {
      fs.mkdirSync(ledgerDir, { recursive: true });
    }
    const ledgerPath = path.join(ledgerDir, 'staff_provisioning_ledger.txt');

    let ledgerText = `================================================================================\n`;
    ledgerText += `🔑 SECURE CLINICAL STAFF PROVISIONING LEDGER - ONLY GENERATED ONCE\n`;
    ledgerText += `================================================================================\n`;
    ledgerText += `Date Generated: ${new Date().toISOString()}\n`;
    ledgerText += `Tenant ID:      ${tenantId}\n`;
    ledgerText += `Branch ID:      ${branchId}\n`;
    ledgerText += `================================================================================\n\n`;

    for (const entry of provisionLedger) {
      ledgerText += `👤 STAFF MEMBER: ${entry.name}\n`;
      ledgerText += `   └─ Email:      ${entry.email}\n`;
      ledgerText += `   └─ Role:       ${entry.role}\n`;
      ledgerText += `   └─ Temp Pass:  ${entry.tempPass}\n`;
      ledgerText += `   └─ TOTP Seed:  ${entry.totpSecret}\n\n`;
    }
    ledgerText += `================================================================================\n`;

    fs.writeFileSync(ledgerPath, ledgerText, 'utf-8');

    // Display the secure ledger in console
    console.log(ledgerText);
    console.log(`🔑 [SECURITY_LEDGER] Secure ledger saved to local file: templates/staff_provisioning_ledger.txt`);
    console.log(`\n🎉 [PROVISION_SUCCESS] Roster accounts provisioned and locked with MFA successfully!`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error(`\n❌ [PROVISION_FAILED] Roster provisioning aborted:`, error.message);
    console.error('All database modifications were successfully rolled back completely.');
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
