import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { BranchGuard } from '../src/auth/guards/branch.guard';
import { randomUUID } from 'crypto';
import { Reflector } from '@nestjs/core';
import { RequireBranchContext } from '../src/auth/decorators/branch-context.decorator';

@Controller('policy-test')
class PolicyTestController {
  @Post('branch-action')
  @RequireBranchContext()
  @HttpCode(HttpStatus.OK)
  async branchAction(@Body() body: any) {
    return { success: true };
  }
}

describe('Cross-Branch Policy (e2e)', () => {
  let app: INestApplication<App>;

  const tenantId = randomUUID();
  const branchAId = randomUUID();
  const branchBId = randomUUID();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [PolicyTestController],
      providers: [BranchGuard],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    const reflector = app.get(Reflector);
    app.useGlobalGuards(new MockJwtAuthGuard());
    app.useGlobalGuards(new BranchGuard(reflector));

    await app.init();

    MockJwtAuthGuard.user.tenantId = tenantId;
  });

  it('Branch Admin A should NOT be able to access action for Branch B', async () => {
    MockJwtAuthGuard.user.roles = ['Branch Admin'];
    MockJwtAuthGuard.user.branchId = branchAId;

    return request(app.getHttpServer())
      .post('/policy-test/branch-action')
      .send({ branchId: branchBId }) // Mismatch
      .expect(403);
  });

  it('Branch Admin A SHOULD be able to access action for Branch A', async () => {
    MockJwtAuthGuard.user.roles = ['Branch Admin'];
    MockJwtAuthGuard.user.branchId = branchAId;

    return request(app.getHttpServer())
      .post('/policy-test/branch-action')
      .send({ branchId: branchAId }) // Match
      .expect(200);
  });

  it('Super Admin (multi-branch) SHOULD be able to access action for ANY branch', async () => {
    MockJwtAuthGuard.user.roles = ['Super Admin'];
    MockJwtAuthGuard.user.branchId = branchAId; // Super Admin has a default branch but can cross branches

    await request(app.getHttpServer())
      .post('/policy-test/branch-action')
      .send({ branchId: branchAId })
      .expect(200);

    await request(app.getHttpServer())
      .post('/policy-test/branch-action')
      .send({ branchId: branchBId })
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
