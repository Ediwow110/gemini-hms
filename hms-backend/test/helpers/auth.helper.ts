import request from 'supertest';
import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';

export async function loginAs(
  app: INestApplication<App>,
  email: string,
  password: string,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password, tenantCode: 'test-tenant' });

  if (!res.body.accessToken) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return res.body.accessToken;
}
