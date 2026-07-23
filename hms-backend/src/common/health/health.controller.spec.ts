import { HttpStatus } from '@nestjs/common';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const response = () => ({ status: jest.fn() });

  it('reports UP only when database and Redis are ready', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]) };
    const redis = { ping: jest.fn().mockResolvedValue('PONG') };
    const controller = new HealthController(prisma as any, redis);
    const res = response();

    await expect(controller.getHealth(res as any)).resolves.toEqual({
      status: 'UP',
    });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('reports DEGRADED with 503 when Redis is unavailable', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]) };
    const redis = { ping: jest.fn().mockRejectedValue(new Error('down')) };
    const controller = new HealthController(prisma as any, redis);
    const res = response();

    await expect(controller.getHealth(res as any)).resolves.toEqual({
      status: 'DEGRADED',
    });
    expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it('reports DEGRADED with 503 when the database is unavailable', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('down')),
    };
    const redis = { ping: jest.fn().mockResolvedValue('PONG') };
    const controller = new HealthController(prisma as any, redis);
    const res = response();

    await expect(controller.getHealth(res as any)).resolves.toEqual({
      status: 'DEGRADED',
    });
    expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
  });
});
