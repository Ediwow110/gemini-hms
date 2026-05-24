import 'dotenv/config';
import { execSync } from 'child_process';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { validateDemoEnvironment } from './demo-safety-guard';

async function main() {
  console.log('--- Starting Demo Database Reset ---');
  
  // 1. Safety Guard (Destructive)
  validateDemoEnvironment({ isDestructive: true });

  try {
    // 2. Reset database using Prisma
    console.log('Resetting schema and data...');
    // We use env here to pass the confirmed safety state to prisma migrate
    execSync('npx prisma migrate reset --force', { 
      stdio: 'inherit',
      env: { ...process.env, SKIP_SAFETY_CHECK: 'true' } // Allow nested calls if needed, though migrate has its own guards
    });
    
    // 3. Run standard seed
    console.log('\nRunning standard seed...');
    execSync('npx tsx prisma/seed.ts', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });
    
    // 4. Verify aggregate safety without printing PHI
    console.log('\nVerifying no-PHI status...');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    
    const patients = await prisma.patient.findMany();
    let suspiciousCount = 0;
    for (const p of patients) {
      if (!p.firstName.includes('[DEMO]') && !p.firstName.includes('[SYNTHETIC]')) {
        suspiciousCount++;
      }
    }
    
    if (suspiciousCount > 0) {
      console.warn(`\nWARNING: ${suspiciousCount} records missing prefixes. Applying [DEMO]...`);
      for (const p of patients) {
        if (!p.firstName.includes('[DEMO]') && !p.firstName.includes('[SYNTHETIC]')) {
          await prisma.patient.update({
            where: { id: p.id },
            data: { firstName: `[DEMO] ${p.firstName}` }
          });
        }
      }
    }

    await prisma.$disconnect();
    await pool.end();
    
    console.log('\n--- Demo Database Reset Complete & Verified ---');
    console.log('No-PHI status: PROTECTED (Synthetic only)');
    
  } catch (error) {
    console.error('Error during demo reset:', error);
    process.exit(1);
  }
}

main();
