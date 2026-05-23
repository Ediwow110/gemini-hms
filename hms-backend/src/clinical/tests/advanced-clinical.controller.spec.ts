import { Test, TestingModule } from '@nestjs/testing';
import { AdvancedClinicalController } from '../advanced-clinical.controller';
import { ErxService } from '../erx.service';
import { BedManagementService } from '../bed-management.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ForbiddenException } from '@nestjs/common';
import {
  ScreenInteractionsDto,
  AssignBedDto,
} from '../dto/advanced-clinical.dto';

describe('AdvancedClinicalController', () => {
  let controller: AdvancedClinicalController;
  let erxService: Partial<ErxService>;
  let bedService: Partial<BedManagementService>;
  let prismaService: Partial<PrismaService>;

  beforeEach(async () => {
    erxService = {
      screenDrugInteractions: jest.fn().mockResolvedValue([]),
      transmitPrescription: jest.fn().mockResolvedValue({}),
      getTransmissionStatus: jest.fn().mockResolvedValue({}),
    };

    bedService = {
      assignBed: jest.fn().mockResolvedValue({}),
      releaseBed: jest.fn().mockResolvedValue({}),
      getBedOccupancy: jest.fn().mockResolvedValue({}),
    };

    prismaService = {
      cptCode: {
        findMany: jest.fn().mockResolvedValue([]),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdvancedClinicalController],
      providers: [
        { provide: ErxService, useValue: erxService },
        { provide: BedManagementService, useValue: bedService },
        { provide: PrismaService, useValue: prismaService },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdvancedClinicalController>(
      AdvancedClinicalController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('DTO Validation and Tenant Isolation', () => {
    it('screenInteractions calls service with tenantId from context', async () => {
      const dto: ScreenInteractionsDto = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        medications: ['Aspirin'],
      };
      await controller.screenInteractions('tenant-1', dto);
      expect(erxService.screenDrugInteractions).toHaveBeenCalledWith(
        'tenant-1',
        dto.patientId,
        dto.medications,
      );
    });

    it('transmitPrescription uses user.tenantId', async () => {
      await controller.transmitPrescription(
        { tenantId: 'tenant-1' },
        'presc-1',
      );
      expect(erxService.transmitPrescription).toHaveBeenCalledWith(
        'tenant-1',
        'presc-1',
      );
    });

    it('assignBed checks branch presence and passes context', async () => {
      const dto: AssignBedDto = {
        patientId: 'pat-1',
        wardId: 'ward-1',
        bedNumber: '1A',
      };
      const user: any = {
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        roles: ['DOCTOR'],
      };
      await controller.assignBed(user, dto);
      expect(bedService.assignBed).toHaveBeenCalledWith(
        'tenant-1',
        'branch-1',
        dto.patientId,
        dto.wardId,
        dto.bedNumber,
      );
    });

    it('assignBed throws ForbiddenException if no branch and not Super Admin', async () => {
      const dto: AssignBedDto = {
        patientId: 'pat-1',
        wardId: 'ward-1',
        bedNumber: '1A',
      };
      const user: any = { tenantId: 'tenant-1', roles: ['DOCTOR'] };
      await expect(controller.assignBed(user, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
