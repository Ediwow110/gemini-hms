import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { validateDemoEnvironment } from './demo-safety-guard';

async function main() {
  // 1. Safety Guard
  validateDemoEnvironment();

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  try {
    const patients = await prisma.patient.findMany();
    const totalCount = patients.length;
    
    // Check for demo/synthetic prefixes
    const demoCount = patients.filter(p => 
      p.firstName.includes('[DEMO]') || 
      p.firstName.includes('[SYNTHETIC]')
    ).length;

    const suspiciousCount = totalCount - demoCount;
    
    console.log('--- Patient Data Safety Audit ---');
    console.log(`Total Patients: ${totalCount}`);
    console.log(`Protected (Demo/Synthetic): ${demoCount}`);
    console.log(`Suspicious (Missing Prefix): ${suspiciousCount}`);
    
    if (suspiciousCount > 0) {
      console.log('\nWARNING: Suspicious records found that may not be synthetic.');
      console.log('Please run scripts/fix-demo-data.ts to apply demo prefixes before demonstrating.');
      process.exit(1);
    } else {
      console.log('\nCONFIRMED: All patient records are correctly prefixed for demonstration.');
    }
    
  } catch (error) {
    console.error('Error during data audit:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
