import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { LisService } from './lis.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SpecimenStatus } from '@prisma/client';

describe('LisService', () => {
  let service: LisService;
  let prisma: any;
  let auditService: any;

  const tenantId = 'tenant-a';
  const userId = 'user-1';
  const branchId = 'branch-1';
  const patientId = 'patient-1';
  const labOrderId = 'lab-order-1';
  const specimenId = 'specimen-1';

  const mockActivePatient = (id: string, tenant: string) => ({
    id,
    tenantId: tenant,
    firstName: 'John',
    lastName: 'Doe',
    status: 'ACTIVE',
  });

  const mockLabOrder = (overrides = {}) => ({
    id: labOrderId,
    tenantId,
    branchId,
    patientId,
    orderingPhysicianId: 'doc-1',
    status: 'PENDING',
    priority: 'ROUTINE',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const mockSpecimen = (overrides = {}) => ({
    id: specimenId,
    tenantId,
    labOrderId,
    barcode: 'BAR-001',
    specimenType: 'BLOOD',
    status: SpecimenStatus.PENDING_COLLECTION,
    collectedAt: null,
    receivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
      patient: { findFirst: jest.fn() },
      labOrder: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      specimen: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LisService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<LisService>(LisService);
  });

  describe('createLabOrder', () => {
    it('should create lab order transactionally with audit log', async () => {
      prisma.patient.findFirst.mockResolvedValue(
        mockActivePatient(patientId, tenantId),
      );
      const created = mockLabOrder();
      prisma.labOrder.create.mockResolvedValue(created);

      const dto = { patientId, orderingPhysicianId: 'doc-1' };
      const result = await service.createLabOrder(
        tenantId,
        userId,
        branchId,
        dto,
      );

      expect(result.status).toBe('PENDING');
      expect(prisma.labOrder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          branchId,
          patientId,
          createdBy: userId,
        }),
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'LAB_ORDER_CREATED' }),
        expect.objectContaining({ labOrder: prisma.labOrder }),
        branchId,
      );
    });

    it('should throw NotFoundException if patient not found in tenant', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);
      const dto = { patientId, orderingPhysicianId: 'doc-1' };

      await expect(
        service.createLabOrder(tenantId, userId, branchId, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should rollback if audit logging fails', async () => {
      prisma.patient.findFirst.mockResolvedValue(
        mockActivePatient(patientId, tenantId),
      );
      prisma.labOrder.create.mockResolvedValue(mockLabOrder());
      auditService.log.mockRejectedValue(new Error('Audit failure'));

      const dto = { patientId, orderingPhysicianId: 'doc-1' };
      await expect(
        service.createLabOrder(tenantId, userId, branchId, dto),
      ).rejects.toThrow('Audit failure');
    });
  });

  describe('addSpecimen', () => {
    it('should add specimen transactionally with audit log', async () => {
      prisma.labOrder.findFirst.mockResolvedValue(mockLabOrder());
      const created = mockSpecimen();
      prisma.specimen.create.mockResolvedValue(created);

      const dto = { barcode: 'BAR-001', specimenType: 'BLOOD' };
      const result = await service.addSpecimen(
        tenantId,
        userId,
        branchId,
        labOrderId,
        dto,
      );

      expect(result.barcode).toBe('BAR-001');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'SPECIMEN_ADDED' }),
        expect.objectContaining({ specimen: prisma.specimen }),
        branchId,
      );
    });

    it('should throw NotFoundException for cross-tenant lab order', async () => {
      prisma.labOrder.findFirst.mockResolvedValue(null);
      const dto = { barcode: 'BAR-001', specimenType: 'BLOOD' };

      await expect(
        service.addSpecimen(tenantId, userId, branchId, labOrderId, dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSpecimenStatus', () => {
    it('should transition PENDING_COLLECTION -> COLLECTED with timestamp', async () => {
      prisma.specimen.findFirst.mockResolvedValue(mockSpecimen());
      const updated = mockSpecimen({
        status: SpecimenStatus.COLLECTED,
        collectedAt: new Date(),
      });
      prisma.specimen.update.mockResolvedValue(updated);

      const dto = { status: SpecimenStatus.COLLECTED };
      const result = await service.updateSpecimenStatus(
        tenantId,
        userId,
        branchId,
        specimenId,
        dto,
      );

      expect(result.status).toBe('COLLECTED');
      expect(prisma.specimen.update).toHaveBeenCalledWith({
        where: { id: specimenId },
        data: expect.objectContaining({
          status: 'COLLECTED',
          collectedAt: expect.any(Date),
        }),
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'SPECIMEN_COLLECTED' }),
        expect.objectContaining({ specimen: prisma.specimen }),
        branchId,
      );
    });

    it('should transition COLLECTED -> RECEIVED with timestamp', async () => {
      prisma.specimen.findFirst.mockResolvedValue(
        mockSpecimen({ status: SpecimenStatus.COLLECTED }),
      );
      const updated = mockSpecimen({
        status: SpecimenStatus.RECEIVED,
        receivedAt: new Date(),
      });
      prisma.specimen.update.mockResolvedValue(updated);

      const dto = { status: SpecimenStatus.RECEIVED };
      await service.updateSpecimenStatus(
        tenantId,
        userId,
        branchId,
        specimenId,
        dto,
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'SPECIMEN_RECEIVED' }),
        expect.anything(),
        branchId,
      );
    });

    it('should throw ConflictException for invalid transition PENDING_COLLECTION -> RECEIVED', async () => {
      prisma.specimen.findFirst.mockResolvedValue(mockSpecimen());

      const dto = { status: SpecimenStatus.RECEIVED };
      await expect(
        service.updateSpecimenStatus(
          tenantId,
          userId,
          branchId,
          specimenId,
          dto,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException for invalid transition COLLECTED -> PENDING_COLLECTION', async () => {
      prisma.specimen.findFirst.mockResolvedValue(
        mockSpecimen({ status: SpecimenStatus.COLLECTED }),
      );

      const dto = { status: SpecimenStatus.PENDING_COLLECTION };
      await expect(
        service.updateSpecimenStatus(
          tenantId,
          userId,
          branchId,
          specimenId,
          dto,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException for cross-tenant specimen', async () => {
      prisma.specimen.findFirst.mockResolvedValue(null);
      const dto = { status: SpecimenStatus.COLLECTED };

      await expect(
        service.updateSpecimenStatus(
          tenantId,
          userId,
          branchId,
          specimenId,
          dto,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should rollback if audit logging fails during status update', async () => {
      prisma.specimen.findFirst.mockResolvedValue(mockSpecimen());
      prisma.specimen.update.mockResolvedValue(
        mockSpecimen({ status: SpecimenStatus.COLLECTED }),
      );
      auditService.log.mockRejectedValue(new Error('Audit failure'));

      const dto = { status: SpecimenStatus.COLLECTED };
      await expect(
        service.updateSpecimenStatus(
          tenantId,
          userId,
          branchId,
          specimenId,
          dto,
        ),
      ).rejects.toThrow('Audit failure');
    });
  });
});
