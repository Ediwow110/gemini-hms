import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { BranchGuard } from '../auth/guards/branch.guard';
import { RadiologyController } from './radiology.controller';

describe('RadiologyController', () => {
  let controller: RadiologyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RadiologyController],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(BranchGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RadiologyController>(RadiologyController);
  });

  it('GET orders returns empty array placeholder', () => {
    expect(controller.listOrders()).toEqual([]);
  });
});