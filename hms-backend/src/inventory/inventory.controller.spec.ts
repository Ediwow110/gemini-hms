import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { BranchGuard } from '../auth/guards/branch.guard';

describe('InventoryController', () => {
  let controller: InventoryController;
  let service: any;

  beforeEach(async () => {
    service = {
      getCatalog: jest.fn(),
      getItem: jest.fn(),
      createItem: jest.fn(),
      receiveStock: jest.fn(),
      adjustStock: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [{ provide: InventoryService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(BranchGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<InventoryController>(InventoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('createItem should call service', async () => {
    const dto = { name: 'Test', sku: 'SKU1', unitOfMeasure: 'EA', price: 10 };
    await controller.createItem('t1', 'b1', 'u1', dto);
    expect(service.createItem).toHaveBeenCalledWith('t1', 'b1', 'u1', dto);
  });

  it('receiveStock should call service', async () => {
    const dto = { inventoryItemId: 'i1', batchNumber: 'B1', quantity: 10 };
    await controller.receiveStock('t1', 'b1', 'u1', dto);
    expect(service.receiveStock).toHaveBeenCalledWith('t1', 'b1', 'u1', dto);
  });

  it('adjustStock should call service', async () => {
    const dto = { inventoryItemId: 'i1', quantityChange: 5, reason: 'Test' };
    await controller.adjustStock('t1', 'b1', 'u1', dto);
    expect(service.adjustStock).toHaveBeenCalledWith('t1', 'b1', 'u1', dto);
  });
});
