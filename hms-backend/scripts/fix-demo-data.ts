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
    console.log(`Found ${patients.length} patients. Prefixing with [DEMO] if missing...`);
    
    for (const p of patients) {
      if (!p.firstName.includes('[DEMO]') && !p.firstName.includes('[SYNTHETIC]')) {
        const newFirstName = `[DEMO] ${p.firstName}`;
        await prisma.patient.update({
          where: { id: p.id },
          data: { firstName: newFirstName }
        });
        console.log(`- Updated: ${p.firstName} ${p.lastName} -> ${newFirstName} ${p.lastName}`);
      }
    }
    
    console.log('\nAll patient names now contain demo/synthetic prefixes.');
    
  } catch (error) {
    console.error('Error fixing patients:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
