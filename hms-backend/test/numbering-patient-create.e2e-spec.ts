import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { execSync } from 'child_process';
import * as path from 'path';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PatientsModule } from '../src/patients/patients.module';
import { NumberingModule } from '../src/numbering/numbering.module';
import { AuditModule } from '../src/audit/audit.module';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { cleanupDatabase } from './helpers/db-cleanup';

jest.setTimeout(180000);

const MAIN_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const MAIN_BRANCH_ID = '00000000-0000-0000-0000-000000000010';

describe('NumberingService patient-creation chain (e2e runtime proof)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let nurseUserId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';

    const bootstrapModule: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
      ],
    }).compile();
    const bootstrapPrisma = bootstrapModule.get(PrismaService);
    await cleanupDatabase(bootstrapPrisma);
    await bootstrapModule.close();

    execSync('npx ts-node prisma/seed.ts', {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, NODE_ENV: 'test' },
      stdio: 'pipe',
    });

    const reopenModule: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
      ],
    }).compile();
    prisma = reopenModule.get(PrismaService);

    const nurseUser = await prisma.user.findFirst({
      where: { tenantId: MAIN_TENANT_ID, email: 'nurse@hospital.com' },
    });
    if (!nurseUser) {
      throw new Error('Seed did not create nurse@hospital.com user');
    }
    nurseUserId = nurseUser.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST /api/v1/patients must succeed for a Nurse with patient.create', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        NumberingModule,
        AuditModule,
        PatientsModule,
      ],
    }).compile();

    const testApp = moduleFixture.createNestApplication();
    testApp.useGlobalPipes(new ValidationPipe({ transform: true }));
    testApp.useGlobalGuards(new MockJwtAuthGuard());
    await testApp.init();

    try {
      MockJwtAuthGuard.user = {
        userId: nurseUserId,
        tenantId: MAIN_TENANT_ID,
        branchId: MAIN_BRANCH_ID,
        roles: ['Nurse'],
        permissions: [],
        email: 'nurse@hospital.com',
      };

      const response = await request(testApp.getHttpServer())
        .post('/api/v1/patients')
        .send({
          firstName: 'Runtime',
          lastName: 'Proof',
          dob: '1990-01-01',
          contactNumber: '555-0199',
          address: '123 Runtime St',
          gender: 'Female',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.firstName).toBe('Runtime');
      expect(response.body.lastName).toBe('Proof');
      expect(response.body.patientNumber).toMatch(/^PT-\d{6}$/);
    } finally {
      await testApp.close();
    }
  });
});
