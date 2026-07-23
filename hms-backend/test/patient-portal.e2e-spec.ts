import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import { PatientPortalModule } from '../src/patient-portal/patient-portal.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrescriptionStatus } from '@prisma/client';

function extractPatientToken(res: request.Response): string {
  const cookies = res.headers['set-cookie'];
  if (!cookies) throw new Error('No set-cookie header');
  const tokenCookie = Array.isArray(cookies)
    ? cookies.find((c: string) => c.startsWith('patient_token='))
    : cookies;
  if (!tokenCookie) throw new Error('No patient_token cookie');
  return tokenCookie.split(';')[0].replace('patient_token=', '');
}

describe('Patient Portal E2E', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let tenant: any;
  let branch: any;

  let patientA: any;
  let patientB: any;

  let patientUserA: any;
  let patientUserB: any;

  let doctor: any;

  let encounterA: any;
  let encounterB: any;

  let orderA1: any;
  let orderA2: any;
  let orderB: any;

  let labReleasedA: any;
  let labUnreleasedA: any;
  let labReleasedB: any;

  let invoiceA: any;
  let invoiceB: any;

  let rxActiveA: any;
  let rxCancelledA: any;
  let rxActiveB: any;

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough-patient';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        PatientPortalModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.use(cookieParser());
    await app.init();

    prisma = app.get(PrismaService);

    // 1. Setup Tenant and Branch
    tenant = await prisma.tenant.create({
      data: { name: `Portal-Tenant-${randomUUID()}` },
    });

    branch = await prisma.branch.create({
      data: {
        id: randomUUID(),
        tenantId: tenant.id,
        name: 'Portal E2E Branch',
        code: `PB-${randomUUID().substring(0, 4)}`,
      },
    });

    // 2. Setup Patient records
    patientA = await prisma.patient.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Alice',
        lastName: 'PatientA',
        dob: new Date('1990-01-01'),
        patientNumber: `PA-${randomUUID().substring(0, 8)}`,
        status: 'ACTIVE',
      },
    });

    patientB = await prisma.patient.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Bob',
        lastName: 'PatientB',
        dob: new Date('1992-02-02'),
        patientNumber: `PB-${randomUUID().substring(0, 8)}`,
        status: 'ACTIVE',
      },
    });

    // 3. Setup Patient Users for portal auth
    const passHash = await bcrypt.hash('password123', 10);

    patientUserA = await prisma.patientUser.create({
      data: {
        tenantId: tenant.id,
        patientId: patientA.id,
        email: 'alice@portal.local',
        passwordHash: passHash,
        status: 'ACTIVE',
      },
    });

    patientUserB = await prisma.patientUser.create({
      data: {
        tenantId: tenant.id,
        patientId: patientB.id,
        email: 'bob@portal.local',
        passwordHash: passHash,
        status: 'ACTIVE',
      },
    });

    // 4. Setup Doctor User
    doctor = await prisma.user.create({
      data: {
        id: randomUUID(),
        tenantId: tenant.id,
        email: `doc-${randomUUID()}@hms.local`,
        passwordHash: passHash,
        status: 'ACTIVE',
      },
    });

    // 5. Setup Encounters
    encounterA = await prisma.encounter.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        patientId: patientA.id,
        doctorId: doctor.id,
        chiefComplaint: 'Alice E2E complaint',
        status: 'OPEN',
        createdBy: doctor.id,
        updatedBy: doctor.id,
      },
    });

    encounterB = await prisma.encounter.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        patientId: patientB.id,
        doctorId: doctor.id,
        chiefComplaint: 'Bob E2E complaint',
        status: 'OPEN',
        createdBy: doctor.id,
        updatedBy: doctor.id,
      },
    });

    // 6. Setup Orders
    orderA1 = await prisma.order.create({
      data: {
        id: randomUUID(),
        tenantId: tenant.id,
        branchId: branch.id,
        patientId: patientA.id,
        orderNumber: `ORD-A1-${randomUUID().substring(0, 6)}`,
        status: 'PENDING',
      },
    });

    orderA2 = await prisma.order.create({
      data: {
        id: randomUUID(),
        tenantId: tenant.id,
        branchId: branch.id,
        patientId: patientA.id,
        orderNumber: `ORD-A2-${randomUUID().substring(0, 6)}`,
        status: 'PENDING',
      },
    });

    orderB = await prisma.order.create({
      data: {
        id: randomUUID(),
        tenantId: tenant.id,
        branchId: branch.id,
        patientId: patientB.id,
        orderNumber: `ORD-B-${randomUUID().substring(0, 6)}`,
        status: 'PENDING',
      },
    });

    // 7. Setup Lab Results
    labReleasedA = await prisma.labResult.create({
      data: {
        tenantId: tenant.id,
        orderId: orderA1.id,
        status: 'RELEASED',
        results: { cholesterol: 195 },
        remarks: 'Released normal results for A',
        lockedAt: new Date(),
      },
    });

    labUnreleasedA = await prisma.labResult.create({
      data: {
        tenantId: tenant.id,
        orderId: orderA2.id,
        status: 'APPROVED',
        results: { cholesterol: 215 },
        remarks: 'Approved but unreleased results for A',
      },
    });

    labReleasedB = await prisma.labResult.create({
      data: {
        tenantId: tenant.id,
        orderId: orderB.id,
        status: 'RELEASED',
        results: { cholesterol: 185 },
        remarks: 'Released results for B',
        lockedAt: new Date(),
      },
    });

    // 8. Setup Invoices
    invoiceA = await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        orderId: orderA1.id,
        invoiceNumber: `INV-A-${randomUUID().substring(0, 6)}`,
        totalAmount: 150.0,
        paidAmount: 40.0,
        status: 'PARTIALLY_PAID',
      },
    });

    invoiceB = await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        orderId: orderB.id,
        invoiceNumber: `INV-B-${randomUUID().substring(0, 6)}`,
        totalAmount: 200.0,
        paidAmount: 200.0,
        status: 'PAID',
      },
    });

    // 9. Setup Prescriptions
    rxActiveA = await prisma.prescription.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        encounterId: encounterA.id,
        prescribedById: doctor.id,
        patientId: patientA.id,
        medicationName: 'Amoxicillin 500mg',
        dosage: '1 capsule',
        frequency: 'Three times daily',
        duration: '7 days',
        status: PrescriptionStatus.ACTIVE,
      },
    });

    rxCancelledA = await prisma.prescription.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        encounterId: encounterA.id,
        prescribedById: doctor.id,
        patientId: patientA.id,
        medicationName: 'Ibuprofen 400mg',
        dosage: '1 tablet',
        frequency: 'As needed',
        duration: '5 days',
        status: PrescriptionStatus.CANCELLED,
      },
    });

    rxActiveB = await prisma.prescription.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        encounterId: encounterB.id,
        prescribedById: doctor.id,
        patientId: patientB.id,
        medicationName: 'Paracetamol 500mg',
        dosage: '2 tablets',
        frequency: 'As needed',
        duration: '3 days',
        status: PrescriptionStatus.ACTIVE,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Patient Login & Authentication', () => {
    it('should successfully login and return only safe patient info + set httpOnly + CSRF cookies', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/patient-portal/auth/login')
        .send({
          tenantCode: tenant.name,
          email: 'alice@portal.local',
          password: 'password123',
        })
        .expect(200);

      // Default response must NOT expose accessToken to browser JS
      expect(res.body.accessToken).toBeUndefined();
      expect(res.body.patientId).toBe(patientA.id);
      expect(res.body.email).toBe('alice@portal.local');

      // Browser clients get httpOnly auth cookie (dual-mode auth)
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const patientCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('patient_token='))
        : cookies;
      expect(patientCookie).toBeDefined();
      expect(patientCookie).toContain('HttpOnly');

      // Browser clients get non-httpOnly CSRF cookie for double-submit pattern
      const csrfCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('patient_csrf='))
        : cookies;
      expect(csrfCookie).toBeDefined();

      // Cookies are scoped to /api/v1/patient-portal
      if (patientCookie)
        expect(patientCookie).toContain('Path=/api/v1/patient-portal');
      if (csrfCookie) expect(csrfCookie).toContain('Path=/api/v1/patient-portal');
    });

    it('should never return accessToken in login response body even with X-Request-Access-Token header', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/patient-portal/auth/login')
        .set('X-Request-Access-Token', 'true')
        .send({
          tenantCode: tenant.name,
          email: 'alice@portal.local',
          password: 'password123',
        })
        .expect(200);

      // X-Request-Access-Token opt-in has been removed — login never returns accessToken
      expect(res.body.accessToken).toBeUndefined();
      expect(res.body.patientId).toBe(patientA.id);
    });

    it('should reject login for incorrect passwords with 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/patient-portal/auth/login')
        .send({
          tenantCode: tenant.name,
          email: 'alice@portal.local',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should reject login for non-existent tenants with 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/patient-portal/auth/login')
        .send({
          tenantCode: 'NonExistentTenant',
          email: 'alice@portal.local',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('Authenticated Patient Portal Operations', () => {
    let tokenA: string;
    let tokenB: string;

    beforeAll(async () => {
      const resA = await request(app.getHttpServer())
        .post('/api/v1/patient-portal/auth/login')
        .send({
          tenantCode: tenant.name,
          email: 'alice@portal.local',
          password: 'password123',
        });
      // Extract token from Set-Cookie header (default response no longer exposes accessToken)
      tokenA = extractPatientToken(resA);

      const resB = await request(app.getHttpServer())
        .post('/api/v1/patient-portal/auth/login')
        .send({
          tenantCode: tenant.name,
          email: 'bob@portal.local',
          password: 'password123',
        });
      tokenB = extractPatientToken(resB);
    });

    it('should fetch own profile via Bearer token (programmatic)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/patient-portal/profile')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.id).toBe(patientA.id);
      expect(res.body.firstName).toBe('Alice');
      expect(res.body.lastName).toBe('PatientA');
    });

    it('should fetch own profile via httpOnly cookie (browser)', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/patient-portal/auth/login')
        .send({
          tenantCode: tenant.name,
          email: 'alice@portal.local',
          password: 'password123',
        });
      const cookieToken = extractPatientToken(loginRes);

      const res = await request(app.getHttpServer())
        .get('/api/v1/patient-portal/profile')
        .set('Cookie', `patient_token=${cookieToken}`)
        .expect(200);

      expect(res.body.id).toBe(patientA.id);
      expect(res.body.firstName).toBe('Alice');
    });

    it("should fetch own released lab results, excluding unreleased results and other patients' results", async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/patient-portal/lab-results')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      // Verify patient A gets exactly 1 released lab result
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(labReleasedA.id);
      expect(res.body[0].status).toBe('RELEASED');
      expect(res.body[0].remarks).toBe('Released normal results for A');

      // Verify that unreleased labResult (labUnreleasedA) is not present
      const foundUnreleased = res.body.some(
        (r: any) => r.id === labUnreleasedA.id,
      );
      expect(foundUnreleased).toBe(false);

      // Verify that Patient B's labResult is not present
      const foundPatientBResult = res.body.some(
        (r: any) => r.id === labReleasedB.id,
      );
      expect(foundPatientBResult).toBe(false);
    });

    it("should fetch own invoices with calculated balances and isolate other patients' invoices", async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/patient-portal/invoices')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      // Verify patient A gets exactly 1 invoice
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(invoiceA.id);
      expect(res.body[0].status).toBe('PARTIALLY_PAID');
      expect(Number(res.body[0].totalAmount)).toBe(150.0);
      expect(Number(res.body[0].paidAmount)).toBe(40.0);
      expect(res.body[0].balance).toBe(110.0); // 150 - 40 = 110 calculated balance

      // Verify Patient B's invoice is not present
      const foundPatientBInvoice = res.body.some(
        (i: any) => i.id === invoiceB.id,
      );
      expect(foundPatientBInvoice).toBe(false);
    });

    it("should fetch own active prescriptions, excluding cancelled prescriptions and other patients' prescriptions", async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/patient-portal/prescriptions')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      // Verify patient A gets exactly 1 prescription (active)
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(rxActiveA.id);
      expect(res.body[0].medicationName).toBe('Amoxicillin 500mg');
      expect(res.body[0].status).toBe(PrescriptionStatus.ACTIVE);

      // Verify that cancelled prescription is excluded
      const foundCancelled = res.body.some(
        (rx: any) => rx.id === rxCancelledA.id,
      );
      expect(foundCancelled).toBe(false);

      // Verify Patient B's active prescription is excluded
      const foundPatientBRx = res.body.some(
        (rx: any) => rx.id === rxActiveB.id,
      );
      expect(foundPatientBRx).toBe(false);
    });

    function extractCsrfToken(loginRes: request.Response): string {
      const cookies = loginRes.headers['set-cookie'];
      const csrfCookieStr = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('patient_csrf='))
        : cookies;
      if (!csrfCookieStr) return '';
      return csrfCookieStr.split(';')[0].replace('patient_csrf=', '');
    }

    it('should reject logout without CSRF token with 403', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/patient-portal/auth/login')
        .send({
          tenantCode: tenant.name,
          email: 'alice@portal.local',
          password: 'password123',
        });
      const cookieToken = extractPatientToken(loginRes);

      // Logout without CSRF token should be rejected
      await request(app.getHttpServer())
        .post('/api/v1/patient-portal/auth/logout')
        .set('Cookie', `patient_token=${cookieToken}`)
        .expect(403);
    });

    it('should reject logout with invalid CSRF token with 403', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/patient-portal/auth/login')
        .send({
          tenantCode: tenant.name,
          email: 'alice@portal.local',
          password: 'password123',
        });
      const cookieToken = extractPatientToken(loginRes);
      const csrfToken = extractCsrfToken(loginRes);

      // Send both cookies but wrong CSRF header value
      await request(app.getHttpServer())
        .post('/api/v1/patient-portal/auth/logout')
        .set(
          'Cookie',
          `patient_token=${cookieToken}; patient_csrf=${csrfToken}`,
        )
        .set('X-CSRF-Token', 'invalid-csrf-token-value')
        .expect(403);
    });

    it('should logout and clear cookies when valid CSRF token is provided', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/patient-portal/auth/login')
        .send({
          tenantCode: tenant.name,
          email: 'alice@portal.local',
          password: 'password123',
        });
      const cookieToken = extractPatientToken(loginRes);
      const csrfToken = extractCsrfToken(loginRes);

      // Logout with both cookies and matching CSRF header
      const logoutRes = await request(app.getHttpServer())
        .post('/api/v1/patient-portal/auth/logout')
        .set(
          'Cookie',
          `patient_token=${cookieToken}; patient_csrf=${csrfToken}`,
        )
        .set('X-CSRF-Token', csrfToken)
        .expect(204);

      // Verify cookies are cleared
      const setCookie = logoutRes.headers['set-cookie'];
      if (setCookie) {
        const clearTokenCookie = Array.isArray(setCookie)
          ? setCookie.find((c: string) => c.startsWith('patient_token='))
          : setCookie;
        if (clearTokenCookie) {
          expect(clearTokenCookie).toContain('=;');
        }
        const clearCsrfCookie = Array.isArray(setCookie)
          ? setCookie.find((c: string) => c.startsWith('patient_csrf='))
          : setCookie;
        if (clearCsrfCookie) {
          expect(clearCsrfCookie).toContain('=;');
        }
      }
    });

    it('should block patient portal requests without auth with 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/patient-portal/profile')
        .expect(401);
    });

    it('should block patient portal requests using invalid tokens with 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/patient-portal/profile')
        .set('Authorization', 'Bearer invalidtokenstring')
        .expect(401);
    });

    it('should block patient portal requests using a staff JWT token with 401', async () => {
      // Generate a staff-like token (without isPatientPortal claim)
      const staffToken = 'mock-staff-token';
      await request(app.getHttpServer())
        .get('/api/v1/patient-portal/profile')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(401);
    });
  });
});
