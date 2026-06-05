import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

@Controller('unprotected-test')
class UnprotectedController {
  @Get()
  index() {
    return 'should never reach here';
  }
}

describe('Security Posture: Fail-Closed (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [UnprotectedController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should return 401 for a route with NO decorators (Fail-Closed)', () => {
    return request(app.getHttpServer()).get('/unprotected-test').expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
