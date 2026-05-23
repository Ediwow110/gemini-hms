import { Test, TestingModule } from '@nestjs/testing';
import { RegionHealthService } from './region-health.service';
import { ServiceUnavailableException } from '@nestjs/common';

describe('RegionHealthService', () => {
  let service: RegionHealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RegionHealthService],
    }).compile();

    service = module.get<RegionHealthService>(RegionHealthService);
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.REGION_HEALTH_ENABLED;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkRegionHealth', () => {
    it('should throw ServiceUnavailableException in production if REGION_HEALTH_ENABLED is not true', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REGION_HEALTH_ENABLED = 'false';

      await expect(service.checkRegionHealth('us-east-1')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should return mock telemetry and latency 0 in dev if not enabled', async () => {
      process.env.NODE_ENV = 'development';
      process.env.REGION_HEALTH_ENABLED = 'false';

      const result = await service.checkRegionHealth('us-east-1');
      expect(result.isMock).toBe(true);
      expect(result.latencyMs).toBe(0);
    });

    it('should return real-ish telemetry in dev if enabled', async () => {
      process.env.NODE_ENV = 'development';
      process.env.REGION_HEALTH_ENABLED = 'true';

      const result = await service.checkRegionHealth('us-east-1');
      expect(result.isMock).toBe(false);
      expect(result.latencyMs).toBe(45);
    });
  });

  describe('getRegionStatus', () => {
    it('should throw ServiceUnavailableException in production if REGION_HEALTH_ENABLED is not true', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REGION_HEALTH_ENABLED = 'false';

      await expect(service.getRegionStatus()).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should set isMock flag properly', async () => {
      process.env.NODE_ENV = 'development';
      process.env.REGION_HEALTH_ENABLED = 'false';

      const result = await service.getRegionStatus();
      expect(result.isMock).toBe(true);
    });
  });

  describe('runPeriodicHealthChecks', () => {
    it('should skip check in production if REGION_HEALTH_ENABLED is not true', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REGION_HEALTH_ENABLED = 'false';

      // Would throw ServiceUnavailableException if checkRegionHealth was called
      await expect(service.runPeriodicHealthChecks()).resolves.not.toThrow();
    });

    it('should perform check in development even if not enabled (mock mode)', async () => {
      process.env.NODE_ENV = 'development';
      process.env.REGION_HEALTH_ENABLED = 'false';

      await expect(service.runPeriodicHealthChecks()).resolves.not.toThrow();
    });
  });
});
