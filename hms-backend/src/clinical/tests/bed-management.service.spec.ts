import { BedManagementService } from '../bed-management.service';
import { BadRequestException } from '@nestjs/common';

describe('BedManagementService - Production Safety', () => {
  let service: BedManagementService;
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

  beforeEach(() => {
    service = new BedManagementService();
    process.env.NODE_ENV = 'production';
  });

  afterAll(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  });

  it('should throw error for assignBed in production', async () => {
    await expect(
      service.assignBed('tenant1', 'branch1', 'patient1', 'ward1', 'bed1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw error for releaseBed in production', async () => {
    await expect(
      service.releaseBed('tenant1', 'branch1', 'ward1-bed1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw error for getBedOccupancy in production', async () => {
    await expect(service.getBedOccupancy('tenant1', 'branch1')).rejects.toThrow(
      BadRequestException,
    );
  });
});
