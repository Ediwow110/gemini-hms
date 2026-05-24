import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  try {
    const patients = await prisma.patient.findMany();
    console.log(`Found ${patients.length} patients.`);
    patients.forEach((p) => {
      console.log(`- [${p.patientNumber}] ${p.firstName} ${p.lastName} (Status: ${p.status})`);
    });
    
    // Check for any ambiguous names or data
    const realDataKeywords = ['John Doe', 'Jane Smith', 'Test Patient']; // Common synthetic names, but I should look for real-looking names
    const suspicious = patients.filter(p => 
      !p.firstName.includes('[DEMO]') && 
      !p.firstName.includes('[SYNTHETIC]') &&
      !p.lastName.includes('[DEMO]') &&
      !p.lastName.includes('[SYNTHETIC]')
    );
    
    if (suspicious.length > 0) {
      console.log('\nWARNING: Suspicious patient data found (missing demo/synthetic prefixes):');
      suspicious.forEach(p => console.log(`  !! ${p.firstName} ${p.lastName}`));
    } else {
      console.log('\nCONFIRMED: All patient names contain [DEMO] or [SYNTHETIC] prefixes.');
    }
    
  } catch (error) {
    console.error('Error checking patients:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
