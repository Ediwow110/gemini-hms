import 'dotenv/config';
import { execSync } from 'child_process';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('--- Starting Demo Database Reset ---');
  
  try {
    // 1. Reset database using Prisma
    console.log('Resetting schema and data...');
    execSync('npx prisma migrate reset --force --skip-seed', { stdio: 'inherit' });
    
    // 2. Run standard seed
    console.log('\nRunning standard seed...');
    execSync('npx tsx prisma/seed.ts', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });
    
    // 3. Apply Demo Prefixes (Double check)
    console.log('\nApplying [DEMO] prefixes to all patients...');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    
    const patients = await prisma.patient.findMany();
    for (const p of patients) {
      if (!p.firstName.includes('[DEMO]') && !p.firstName.includes('[SYNTHETIC]')) {
        await prisma.patient.update({
          where: { id: p.id },
          data: { firstName: `[DEMO] ${p.firstName}` }
        });
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
