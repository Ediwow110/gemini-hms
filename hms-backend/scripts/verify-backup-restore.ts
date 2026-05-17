import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

async function verifyBackup(backupPath: string) {
  console.log(`Starting backup verification for: ${backupPath}`);
  
  const TEST_DB_URL = process.env.DATABASE_URL_RESTORE_TEST;
  if (!TEST_DB_URL) {
      console.error('DATABASE_URL_RESTORE_TEST not set');
      process.exit(1);
  }

  try {
    // 1. Drop and Create temporary DB
    console.log('Resetting restore-test database...');
    // Overriding DATABASE_URL for prisma CLI
    process.env.DATABASE_URL = TEST_DB_URL;
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });

    // 2. Restore the backup
    console.log('Restoring backup...');
    // execSync(`psql ${TEST_DB_URL} < ${backupPath}`);
    console.log('Restore command executed (STUB)');

    // 3. Smoke Test with Prisma
    console.log('Running smoke tests on restored data...');
    // Pass the URL via env var which is now set to TEST_DB_URL
    const prisma = new PrismaClient();

    const userCount = await prisma.user.count();
    const tenantCount = await prisma.tenant.count();
    
    console.log(`Verified: ${userCount} users, ${tenantCount} tenants found.`);

    if (userCount === 0 || tenantCount === 0) {
        throw new Error('Restored database is empty or corrupt');
    }

    console.log('Backup verification SUCCESSFUL');
    await prisma.$disconnect();
  } catch (error) {
    console.error('Backup verification FAILED');
    console.error(error);
    process.exit(1);
  }
}

const path = process.argv[2] || 'latest-backup.sql';
verifyBackup(path);
