import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { validateDemoEnvironment } from './demo-safety-guard';

async function main() {
  // 1. Safety Guard
  validateDemoEnvironment();

  // 2. Fix-Specific Guard
  if (process.env.DEMO_DB_FIX_CONFIRM !== 'FIX_SYNTHETIC_DEMO_LABELS') {
    console.error('\nERROR: Fix confirmation missing.');
    console.error('To apply demo prefixes to all patients, set:');
    console.error('DEMO_DB_FIX_CONFIRM=FIX_SYNTHETIC_DEMO_LABELS');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  try {
    const patients = await prisma.patient.findMany();
    let updatedCount = 0;
    
    console.log(`Processing ${patients.length} patients...`);
    
    for (const p of patients) {
      if (!p.firstName.includes('[DEMO]') && !p.firstName.includes('[SYNTHETIC]')) {
        await prisma.patient.update({
          where: { id: p.id },
          data: { firstName: `[DEMO] ${p.firstName}` }
        });
        updatedCount++;
      }
    }
    
    console.log(`\nSUCCESS: Applied [DEMO] prefix to ${updatedCount} patients.`);
    console.log('No-PHI status: PROTECTED (Aggregate only)');
    
  } catch (error) {
    console.error('Error during data fix:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
