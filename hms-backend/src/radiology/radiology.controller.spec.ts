import { Test, TestingModule } from '@nestjs/testing';
import { NotImplementedException } from '@nestjs/common';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { BranchGuard } from '../auth/guards/branch.guard';
import { RadiologyController } from './radiology.controller';
import { RadiologyService } from './radiology.service';
import type { RequestUser } from '../common/types/authenticated-request.type';

describe('RadiologyController', () => {
  let controller: RadiologyController;
  let radiologyService: { listImagingOrders: jest.Mock };

  const actor: RequestUser = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    roles: ['Doctor'],
    tokenVersion: 0,
  };

  beforeEach(async () => {
    radiologyService = { listImagingOrders: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RadiologyController],
      providers: [{ provide: RadiologyService, useValue: radiologyService }],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(BranchGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RadiologyController>(RadiologyController);
  });

  it('GET orders delegates to RadiologyService.listImagingOrders', async () => {
    const orders = [
      {
        id: 'order-1',
        orderNumber: 'IMG-1',
        patientName: 'Jane Doe',
        procedure: 'MRI Brain',
        priority: 'ROUTINE' as const,
        phase: 'PENDING' as const,
        requestedAt: '2026-06-01T00:00:00.000Z',
      },
    ];
    radiologyService.listImagingOrders.mockResolvedValueOnce(orders);

    await expect(controller.listOrders(actor)).resolves.toEqual(orders);
    expect(radiologyService.listImagingOrders).toHaveBeenCalledWith(actor);
  });

  it('POST finalize throws NotImplementedException', () => {
    expect(() =>
      controller.finalizeOrder('order-1', { interpretation: 'clear' }),
    ).toThrow(NotImplementedException);
  });
});