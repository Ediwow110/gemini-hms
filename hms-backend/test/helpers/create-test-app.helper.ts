import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';

export async function createTestApp() {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return { app, moduleRef };
}

export async function getAuthToken(
  app: INestApplication<App>,
  credentials: { email: string; password: string },
) {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send(credentials);
  return response.body.accessToken;
}
