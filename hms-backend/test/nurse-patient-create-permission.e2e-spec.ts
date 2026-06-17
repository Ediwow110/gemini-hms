import { Test, TestingModule } from '@nestjs/testing';
import { execSync } from 'child_process';
import * as path from 'path';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanupDatabase } from './helpers/db-cleanup';

jest.setTimeout(180000);

const MAIN_TENANT_ID = '00000000-0000-0000-0000-000000000001';

describe('Nurse role has patient.create permission after seed (e2e)', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    const bootstrapModule: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
      ],
    }).compile();
    prisma = bootstrapModule.get(PrismaService);
    await cleanupDatabase(prisma);
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
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('seed assigns patient.create to the Nurse role in the main tenant', async () => {
    const nurseRole = await prisma.role.findFirst({
      where: { tenantId: MAIN_TENANT_ID, name: 'Nurse' },
    });
    expect(nurseRole).toBeDefined();
    expect(nurseRole!.status).toBe('ACTIVE');

    const rolePermission = await prisma.rolePermission.findFirst({
      where: {
        roleId: nurseRole!.id,
        permission: {
          name: 'patient.create',
          tenantId: MAIN_TENANT_ID,
        },
      },
      include: { permission: true },
    });

    expect(rolePermission).toBeDefined();
    expect(rolePermission!.permission.name).toBe('patient.create');
  });

  it('seed keeps existing Nurse permissions intact (regression guard)', async () => {
    const nurseRole = await prisma.role.findFirst({
      where: { tenantId: MAIN_TENANT_ID, name: 'Nurse' },
    });

    const requiredPermissions = [
      'patient.view',
      'patient.create',
      'patient.update',
      'encounter.view',
      'encounter.update',
      'inventory.item.view',
      'queue.view',
      'procurement.request.create',
      'nurse.task.view',
      'nurse.task.update',
    ];

    for (const permName of requiredPermissions) {
      const rp = await prisma.rolePermission.findFirst({
        where: {
          roleId: nurseRole!.id,
          permission: { name: permName, tenantId: MAIN_TENANT_ID },
        },
      });
      expect(rp).toBeDefined();
    }
  });

  it('seed does NOT grant Nurse role permissions it should not have (negative regression guard)', async () => {
    const nurseRole = await prisma.role.findFirst({
      where: { tenantId: MAIN_TENANT_ID, name: 'Nurse' },
    });

    const forbiddenPermissions = [
      'admin.role.change',
      'billing.refund.request',
      'lab.result.approve',
      'lab.result.release',
    ];

    for (const permName of forbiddenPermissions) {
      const rp = await prisma.rolePermission.findFirst({
        where: {
          roleId: nurseRole!.id,
          permission: { name: permName, tenantId: MAIN_TENANT_ID },
        },
      });
      expect(rp).toBeNull();
    }
  });
});
