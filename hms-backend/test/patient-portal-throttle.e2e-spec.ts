import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PatientPortalController } from '../src/patient-portal/patient-portal.controller';
import { PatientPortalService } from '../src/patient-portal/patient-portal.service';
import { DocumentGeneratorService } from '../src/patient-portal/services/document-generator.service';
import { PatientJwtGuard } from '../src/patient-portal/guards/patient-jwt.guard';
import { PatientCsrfGuard } from '../src/patient-portal/guards/patient-csrf.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../src/prisma/prisma.module';

describe('Patient Portal Login Throttle (e2e)', () => {
  let app: INestApplication<App>;
  const login = jest.fn(() => {
    throw new UnauthorizedException('Invalid credentials');
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        JwtModule.register({ secret: 'test-secret-key-for-patient-throttle' }),
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 100 }]),
      ],
      controllers: [PatientPortalController],
      providers: [
        { provide: PatientPortalService, useValue: { login } },
        { provide: DocumentGeneratorService, useValue: {} },
        { provide: PatientJwtGuard, useValue: { canActivate: () => true } },
        { provide: PatientCsrfGuard, useValue: { canActivate: () => true } },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  beforeEach(() => {
    login.mockClear();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('returns 429 on the 6th failed login attempt despite a 100/min global default', async () => {
    const loginData = {
      tenantCode: 'AnyTenant',
      email: 'throttle.patient@portal.local',
      password: 'wrong-password',
    };

    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/api/v1/patient-portal/auth/login')
        .send(loginData)
        .expect(401);
    }

    const res = await request(app.getHttpServer())
      .post('/api/v1/patient-portal/auth/login')
      .send(loginData);

    expect(res.status).toBe(429);
    expect(login).toHaveBeenCalledTimes(5);
  });
});
