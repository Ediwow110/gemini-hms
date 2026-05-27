import { Test } from '@nestjs/testing';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthModule } from '../src/auth/auth.module';
import { AuthService } from '../src/auth/auth.service';
import { SessionService } from '../src/auth/session.service';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from '../src/audit/audit.module';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

async function run() {
  console.log('--- STARTING STRESS TEST: REFRESH TOKEN CONCURRENCY ---');

  process.env.JWT_SECRET = 'test-secret-key-for-mfa-recovery-e2e-tests-long-enough';
  process.env.MASTER_MFA_KEY = 'master-mfa-key-for-encryption-long-enough';

  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
      PrismaModule,
      AuditModule,
      AuthModule,
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const authService = app.get(AuthService);
  const sessionService = app.get(SessionService);
  const prisma = app.get(PrismaService);

  // Setup seed data
  const tenantName = `Stress-Refresh-${randomUUID()}`;
  const tenant = await prisma.tenant.create({ data: { name: tenantName } });
  
  const userEmail = `stress-refresh-${randomUUID()}@hms.local`;
  const passwordHash = await bcrypt.hash('StressPassword123!', 10);
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: userEmail,
      passwordHash,
      mfaEnabled: false,
    }
  });

  const role = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: 'Super Admin',
      isSystem: true,
    }
  });

  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id,
    }
  });

  const userWithRoles = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      userRoles: { include: { role: true } },
    },
  });

  // Perform login to create the initial session
  console.log('Logging in user...');
  await authService.login(userWithRoles as any);

  const session = await prisma.session.findFirst({
    where: { userId: user.id }
  });
  if (!session) {
    throw new Error('Failed to create session');
  }

  // Set MFA verified status
  await sessionService.markMfaVerified(session.id);
  
  // Set initial refresh token
  const initialRtPlain = randomUUID();
  const initialRtHash = await bcrypt.hash(initialRtPlain, 10);
  await sessionService.setInitialRefreshToken(session.id, initialRtHash);

  console.log(`Firing 20 concurrent refresh requests using sessionId: ${session.id}...`);

  const totalRequests = 20;
  const promises: Promise<any>[] = [];

  for (let i = 0; i < totalRequests; i++) {
    promises.push(
      authService.refreshTokens(session.id, initialRtPlain)
        .then(res => ({ success: true, data: res }))
        .catch(err => ({ success: false, error: err.message || err }))
    );
  }

  const results = await Promise.all(promises);

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  console.log(`Results: ${successCount} succeeded, ${failureCount} failed.`);

  // Invariant checks
  const sessionAfter = await prisma.session.findUnique({
    where: { id: session.id }
  });
  const securityBreachLogs = await prisma.auditLog.findMany({
    where: { userId: user.id, eventKey: 'SECURITY_BREACH' }
  });

  const sessionExists = sessionAfter !== null;
  const noSecurityBreach = securityBreachLogs.length === 0;

  const pass = successCount === totalRequests && sessionExists && noSecurityBreach;

  const output = {
    testName: 'Refresh Token Concurrency Stress Test',
    timestamp: new Date().toISOString(),
    totalRequests,
    successCount,
    failureCount,
    invariants: {
      sessionExists,
      noSecurityBreach,
      noDuplicateSessions: (await prisma.session.count({ where: { userId: user.id } })) === 1,
    },
    pass,
    details: results.map((r, i) => ({
      requestIndex: i,
      success: r.success,
      error: r.error || null,
    })),
  };

  const outputPath = path.join(__dirname, '..', 'stress-refresh-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Saved results to ${outputPath}`);
  console.log(`Verdict: ${pass ? 'PASS' : 'FAIL'}\n`);

  await app.close();
  
  if (!pass) {
    process.exit(1);
  }
}

run();
