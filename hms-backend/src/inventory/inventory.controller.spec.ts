import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../common/types/authenticated-request.type';

describe('InventoryController', () => {
  let controller: InventoryController;
  let service: any;

  beforeEach(async () => {
    service = {
      getLowStockAlerts: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [{ provide: InventoryService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
          if (
            !req.user ||
            !req.user.permissions?.includes('inventory.item.view')
          ) {
            return false; // Permission denied without inventory.item.view
          }
          return true;
        },
      })
      .compile();

    controller = module.get<InventoryController>(InventoryController);
  });

  it('low-stock endpoint should be tenant-scoped', async () => {
    const tenantId = 'tenant-xyz';
    const branchId = 'branch-xyz';
    await controller.getLowStockAlerts(tenantId, branchId);
    expect(service.getLowStockAlerts).toHaveBeenCalledWith(tenantId, branchId);
  });
});
