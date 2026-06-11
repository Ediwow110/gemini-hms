import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, EncounterStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

// 1. Safety Guard (Run BEFORE Prisma initialization to avoid connecting to wrong DB)
const databaseUrl = process.env.DATABASE_URL || '';
if (!databaseUrl.includes('staging')) {
  console.error('CRITICAL ERROR: Safety guard triggered. This script must only be run against a STAGING environment.');
  console.error('The DATABASE_URL must contain the substring "staging" to proceed.');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TOTAL_PATIENTS = 100000;
const TOTAL_ENCOUNTERS = 200000;
const CHUNK_SIZE = 5000;

const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzales', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('--- High-Volume Fixture Generation Started ---');

  // 2. Setup Environment Context (Tenant, Branch, User)
  console.log('Fetching/Creating environment context...');
  
  let tenant = await prisma.tenant.findFirst({ where: { name: 'STAGING-VOL-TEST-TENANT' } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        id: randomUUID(),
        name: 'STAGING-VOL-TEST-TENANT',
        status: 'ACTIVE',
      },
    });
  }

  let branch = await prisma.branch.findFirst({ where: { tenantId: tenant.id } });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        id: randomUUID(),
        tenantId: tenant.id,
        name: 'Main Staging Branch',
        code: 'STG-MAIN',
      },
    });
  }

  let user = await prisma.user.findFirst({ where: { tenantId: tenant.id } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: randomUUID(),
        tenantId: tenant.id,
        email: 'vol-test-admin@staging.hms.com',
        passwordHash: 'REDACTED_FOR_VOL_FIXTURES',
        status: 'ACTIVE',
      },
    });
  }

  console.log(`Using Tenant: ${tenant.id}, Branch: ${branch.id}, User: ${user.id}`);

  // 3. Generate and Insert Patients
  console.log(`Generating ${TOTAL_PATIENTS} patients...`);
  const patientIds: string[] = [];
  
  for (let i = 0; i < TOTAL_PATIENTS; i += CHUNK_SIZE) {
    const chunk = [];
    const currentChunkSize = Math.min(CHUNK_SIZE, TOTAL_PATIENTS - i);
    
    for (let j = 0; j < currentChunkSize; j++) {
      const id = randomUUID();
      patientIds.push(id);
      chunk.push({
        id,
        tenantId: tenant.id,
        patientNumber: `VOL-PAT-${i + j}-${Date.now()}`,
        firstName: getRandomItem(firstNames),
        lastName: getRandomItem(lastNames),
        dob: new Date(1950 + Math.floor(Math.random() * 60), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
        status: 'ACTIVE',
        createdById: user.id,
      });
    }
    
    await prisma.patient.createMany({ data: chunk });
    console.log(`Progress: [Patients] ${i + currentChunkSize}/${TOTAL_PATIENTS} inserted.`);
  }

  // 4. Generate and Insert Encounters
  console.log(`Generating ${TOTAL_ENCOUNTERS} encounters...`);
  
  for (let i = 0; i < TOTAL_ENCOUNTERS; i += CHUNK_SIZE) {
    const chunk = [];
    const currentChunkSize = Math.min(CHUNK_SIZE, TOTAL_ENCOUNTERS - i);
    
    for (let j = 0; j < currentChunkSize; j++) {
      chunk.push({
        id: randomUUID(),
        tenantId: tenant.id,
        branchId: branch.id,
        patientId: getRandomItem(patientIds),
        status: EncounterStatus.OPEN,
        type: getRandomItem(['OUTPATIENT', 'EMERGENCY', 'INPATIENT', 'TELEHEALTH']),
        chiefComplaint: 'Synthetic volume test encounter',
        encounteredAt: new Date(),
        createdBy: user.id,
        updatedBy: user.id,
      });
    }
    
    await prisma.encounter.createMany({ data: chunk });
    console.log(`Progress: [Encounters] ${i + currentChunkSize}/${TOTAL_ENCOUNTERS} inserted.`);
  }

  console.log('--- Fixture Generation Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('FATAL ERROR during fixture generation:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
