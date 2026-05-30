import { Test, TestingModule } from '@nestjs/testing';
import { NursingService } from './nursing.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TaskPriority, TaskStatus } from '@prisma/client';

describe('NursingService', () => {
  let service: NursingService;
  let prisma: any;
  let audit: any;

  const mockTenantId = 'tenant-1';
  const mockBranchId = 'branch-1';
  const mockUserId = 'user-1';
  const mockTaskId = 'task-1';
  const mockPatientId = 'patient-1';

  const mockUser = {
    userId: mockUserId,
    tenantId: mockTenantId,
    branchId: mockBranchId,
    roles: ['Nurse'],
    permissions: ['nurse.task.view', 'nurse.task.update'],
  };

  const mockTask = {
    id: mockTaskId,
    tenantId: mockTenantId,
    branchId: mockBranchId,
    patientId: mockPatientId,
    assignedUserId: null,
    createdById: mockUserId,
    title: 'Test Task',
    description: 'Test description',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.OPEN,
    dueAt: null,
    completedAt: null,
    completedById: null,
    cancelledAt: null,
    cancelledById: null,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    patient: {
      id: mockPatientId,
      firstName: 'John',
      lastName: 'Doe',
      patientNumber: 'MRN-001',
    },
    assignedTo: null,
    createdBy: { id: mockUserId, email: 'nurse@test.com' },
    completedBy: null,
    cancelledBy: null,
  };

  beforeEach(async () => {
    prisma = {
      nurseTask: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      patient: {
        findFirst: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((cb: any) => cb(prisma)),
    };

    audit = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NursingService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<NursingService>(NursingService);
  });

  describe('listTasks', () => {
    it('should return tasks scoped to tenant and branch', async () => {
      prisma.nurseTask.findMany.mockResolvedValue([mockTask]);
      const result = await service.listTasks(
        mockTenantId,
        mockBranchId,
        {},
        mockUser,
      );
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Task');
      expect(prisma.nurseTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: mockTenantId,
            branchId: mockBranchId,
          }),
        }),
      );
    });

    it('should filter by status when provided', async () => {
      prisma.nurseTask.findMany.mockResolvedValue([]);
      await service.listTasks(
        mockTenantId,
        mockBranchId,
        { status: TaskStatus.OPEN },
        mockUser,
      );
      expect(prisma.nurseTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: TaskStatus.OPEN }),
        }),
      );
    });

    it('should filter by assignedToMe when true', async () => {
      prisma.nurseTask.findMany.mockResolvedValue([]);
      await service.listTasks(
        mockTenantId,
        mockBranchId,
        { assignedToMe: true },
        mockUser,
      );
      expect(prisma.nurseTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ assignedUserId: mockUserId }),
        }),
      );
    });
  });

  describe('getTask', () => {
    it('should return a task by id within tenant', async () => {
      prisma.nurseTask.findFirst.mockResolvedValue(mockTask);
      const result = await service.getTask(mockTenantId, mockTaskId, mockUser);
      expect(result.title).toBe('Test Task');
      expect(result.patientName).toBe('John Doe');
    });

    it('should throw NotFoundException when task not found', async () => {
      prisma.nurseTask.findFirst.mockResolvedValue(null);
      await expect(
        service.getTask(mockTenantId, mockTaskId, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTask', () => {
    it('should create a task with valid input', async () => {
      prisma.patient.findFirst.mockResolvedValue({ id: mockPatientId });
      prisma.nurseTask.create.mockResolvedValue(mockTask);
      prisma.$transaction.mockImplementation((cb: any) => cb(prisma));

      const dto = {
        title: 'Test Task',
        description: 'Test',
        priority: TaskPriority.HIGH,
        patientId: mockPatientId,
      };
      const result = await service.createTask(
        mockTenantId,
        mockBranchId,
        dto,
        mockUser,
      );
      expect(result.title).toBe('Test Task');
      expect(audit.log).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid patientId', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);
      const dto = { title: 'Test', patientId: 'invalid-patient' };
      await expect(
        service.createTask(mockTenantId, mockBranchId, dto, mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('task lifecycle transitions', () => {
    beforeEach(() => {
      prisma.nurseTask.findFirst.mockResolvedValue(mockTask);
      prisma.nurseTask.update.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.IN_PROGRESS,
      });
      prisma.$transaction.mockImplementation((cb: any) => cb(prisma));
    });

    it('should start a task (OPEN -> IN_PROGRESS)', async () => {
      await service.startTask(mockTenantId, mockTaskId, mockUser);
      expect(prisma.nurseTask.update).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'NURSE_TASK_STARTED' }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('should reject invalid transitions', async () => {
      prisma.nurseTask.findFirst.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.CANCELLED,
      });
      await expect(
        service.startTask(mockTenantId, mockTaskId, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should complete a task', async () => {
      prisma.nurseTask.update.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        completedById: mockUserId,
      });
      await service.completeTask(mockTenantId, mockTaskId, mockUser);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'NURSE_TASK_COMPLETED' }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('should cancel a task', async () => {
      prisma.nurseTask.update.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.CANCELLED,
      });
      await service.cancelTask(
        mockTenantId,
        mockTaskId,
        mockUser,
        'Not needed',
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'NURSE_TASK_CANCELLED' }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('should reopen a completed task', async () => {
      prisma.nurseTask.findFirst.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.COMPLETED,
      });
      prisma.nurseTask.update.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.OPEN,
      });
      await service.reopenTask(mockTenantId, mockTaskId, mockUser);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'NURSE_TASK_REOPENED' }),
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe('tenant isolation', () => {
    it('should throw ForbiddenException for cross-tenant access', async () => {
      const crossTenantUser = { ...mockUser, tenantId: 'other-tenant' };
      await expect(
        service.listTasks(mockTenantId, mockBranchId, {}, crossTenantUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
