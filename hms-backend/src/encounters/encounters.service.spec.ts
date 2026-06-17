import { Test, TestingModule } from '@nestjs/testing';
import { EncountersService } from './encounters.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EncounterStatus } from '@prisma/client';

describe('EncountersService', () => {
  let service: EncountersService;
  let prisma: any;
  let audit: any;

  const tenantId = 'tenant-uuid';
  const userId = 'user-uuid';
  const branchId = 'branch-uuid';
  const patientId = 'patient-uuid';

  beforeEach(async () => {
    prisma = {
      patient: {
        findFirst: jest.fn(),
      },
      encounter: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    audit = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncountersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<EncountersService>(EncountersService);
  });

  describe('create', () => {
    it('should create an encounter and log audit event', async () => {
      const dto = { patientId, type: 'CONSULTATION', reason: 'Fever' };
      const patient = { id: patientId, tenantId, status: 'ACTIVE' };
      const encounter = {
        id: 'enc-uuid',
        ...dto,
        tenantId,
        branchId,
        status: 'IN_PROGRESS',
      };

      prisma.patient.findFirst.mockResolvedValue(patient);
      prisma.encounter.create.mockResolvedValue(encounter);

      const result = await service.create(tenantId, userId, branchId, dto);

      expect(result).toEqual(encounter);
      expect(prisma.patient.findFirst).toHaveBeenCalledWith({
        where: { id: patientId, tenantId },
      });
      expect(prisma.encounter.create).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'ENCOUNTER_CREATED',
          tenantId,
          userId,
        }),
        expect.anything(),
        branchId,
      );
    });

    it('should throw NotFoundException if patient does not exist', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.create(tenantId, userId, branchId, { patientId }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if patient is inactive', async () => {
      prisma.patient.findFirst.mockResolvedValue({
        id: patientId,
        status: 'INACTIVE',
      });

      await expect(
        service.create(tenantId, userId, branchId, { patientId }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return list of encounters scoped by tenant and branch', async () => {
      const encounters = [{ id: 'enc-1', tenantId, branchId }];
      prisma.encounter.findMany.mockResolvedValue(encounters);

      const result = await service.findAll(tenantId, branchId);
      expect(result).toEqual(encounters);
      expect(prisma.encounter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            branchId,
            archivedAt: null,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should enforce branch scope on encounter reads', async () => {
      prisma.encounter.findFirst.mockResolvedValue({
        id: 'enc-1',
        tenantId,
        branchId,
      });

      await service.findOne(tenantId, 'enc-1', branchId);

      expect(prisma.encounter.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'enc-1',
            tenantId,
            branchId,
            archivedAt: null,
          },
        }),
      );
    });

    it('should throw NotFoundException for cross-branch reads', async () => {
      prisma.encounter.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(tenantId, 'enc-1', branchId),
      ).rejects.toThrow(NotFoundException);
    });

    it('excludes archived encounters from operational reads', async () => {
      prisma.encounter.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(tenantId, 'enc-1', branchId),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.encounter.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'enc-1',
          tenantId,
          branchId,
          archivedAt: null,
        },
        include: expect.any(Object),
      });
    });
  });

  describe('update', () => {
    it('should update encounter status and set endedAt if FINISHED', async () => {
      const encounterId = 'enc-uuid';
      const existingEncounter = {
        id: encounterId,
        tenantId,
        branchId,
        status: EncounterStatus.IN_PROGRESS,
      };
      const updatedEncounter = {
        ...existingEncounter,
        status: EncounterStatus.FINISHED,
      };

      prisma.encounter.findFirst
        .mockResolvedValueOnce(existingEncounter)
        .mockResolvedValueOnce(updatedEncounter);
      prisma.encounter.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.update(
        tenantId,
        userId,
        encounterId,
        {
          status: EncounterStatus.FINISHED,
        },
        branchId,
      );

      expect(result.status).toBe(EncounterStatus.FINISHED);
      expect(prisma.encounter.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: encounterId,
            tenantId,
            branchId,
            archivedAt: null,
          },
        }),
      );
      expect(prisma.encounter.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: encounterId,
            tenantId,
            branchId,
            archivedAt: null,
          },
          data: expect.objectContaining({
            endedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('rejects update on archived encounter (findOne throws NotFound)', async () => {
      prisma.encounter.findFirst.mockResolvedValue(null);

      await expect(
        service.update(
          tenantId,
          userId,
          'enc-1',
          { status: EncounterStatus.FINISHED },
          branchId,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.encounter.updateMany).not.toHaveBeenCalled();
    });

    it('rejects update on archived encounter (updateMany count zero fails closed)', async () => {
      prisma.encounter.findFirst.mockResolvedValue({
        id: 'enc-1',
        tenantId,
        branchId,
        status: EncounterStatus.IN_PROGRESS,
      });
      prisma.encounter.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(
          tenantId,
          userId,
          'enc-1',
          { status: EncounterStatus.FINISHED },
          branchId,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(audit.log).not.toHaveBeenCalled();
    });
  });
});
