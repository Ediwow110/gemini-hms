import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';

describe('QueueService', () => {
  let service: QueueService;
  let prisma: any;
  let tx: any;
  let audit: { log: jest.Mock };
  let numbering: { generateNumber: jest.Mock };

  const tenantId = 'tenant-1';
  const branchId = 'branch-1';
  const userId = 'user-1';

  beforeEach(async () => {
    tx = {
      branch: { findFirst: jest.fn() },
      patient: { findFirst: jest.fn() },
      queueEntry: {
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    prisma = {
      $transaction: jest.fn(async (callback: (client: any) => unknown) =>
        callback(tx),
      ),
      queueEntry: {
        findMany: jest.fn(),
        groupBy: jest.fn(),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    numbering = { generateNumber: jest.fn().mockResolvedValue('Q-000001') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: NumberingService, useValue: numbering },
      ],
    }).compile();

    service = module.get(QueueService);
  });

  it('lists only active entries for the requested tenant and branch', async () => {
    prisma.queueEntry.findMany.mockResolvedValue([]);

    await service.listActiveQueue(tenantId, branchId);

    expect(prisma.queueEntry.findMany).toHaveBeenCalledWith({
      where: {
        tenantId,
        branchId,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  });

  it('rejects queue admission when the branch is outside the tenant', async () => {
    tx.branch.findFirst.mockResolvedValue(null);

    await expect(
      service.joinQueue(
        tenantId,
        branchId,
        { patientId: 'patient-1', serviceType: 'RECEPTION' },
        userId,
      ),
    ).rejects.toThrow(NotFoundException);

    expect(tx.patient.findFirst).not.toHaveBeenCalled();
    expect(tx.queueEntry.create).not.toHaveBeenCalled();
  });

  it('rejects queue admission when the patient is outside the tenant', async () => {
    tx.branch.findFirst.mockResolvedValue({ id: branchId });
    tx.patient.findFirst.mockResolvedValue(null);

    await expect(
      service.joinQueue(
        tenantId,
        branchId,
        { patientId: 'patient-1', serviceType: 'RECEPTION' },
        userId,
      ),
    ).rejects.toThrow(NotFoundException);

    expect(tx.patient.findFirst).toHaveBeenCalledWith({
      where: { id: 'patient-1', tenantId },
    });
    expect(tx.queueEntry.create).not.toHaveBeenCalled();
  });

  it('creates queue entries with an atomic NumberingService value and transaction-bound audit', async () => {
    const patient = {
      id: 'patient-1',
      firstName: 'Patient',
      lastName: 'One',
    };
    const created = {
      id: 'entry-1',
      tenantId,
      branchId,
      patientId: patient.id,
      patientName: 'Patient One',
      queueNumber: 'Q-000001',
      category: 'ROUTINE',
      serviceType: 'RECEPTION',
      status: 'WAITING',
    };
    tx.branch.findFirst.mockResolvedValue({ id: branchId });
    tx.patient.findFirst.mockResolvedValue(patient);
    tx.queueEntry.create.mockResolvedValue(created);

    const result = await service.joinQueue(
      tenantId,
      branchId,
      {
        patientId: patient.id,
        serviceType: 'RECEPTION',
        category: 'ROUTINE',
      },
      userId,
    );

    expect(numbering.generateNumber).toHaveBeenCalledWith(
      tenantId,
      'QUEUE',
      branchId,
      tx,
    );
    expect(tx.queueEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ queueNumber: 'Q-000001' }),
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'QUEUE_ENTRY_CREATED',
        userId,
        recordId: created.id,
      }),
      tx,
      branchId,
    );
    expect(result).toEqual(created);
  });

  it('atomically claims the next waiting entry and records the transition', async () => {
    const waiting = {
      id: 'entry-1',
      status: 'WAITING',
      createdAt: new Date(),
    };
    const calling = { ...waiting, status: 'CALLING' };
    tx.branch.findFirst.mockResolvedValue({ id: branchId });
    tx.queueEntry.findFirst
      .mockResolvedValueOnce(waiting)
      .mockResolvedValueOnce(calling);
    tx.queueEntry.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.callNext(tenantId, branchId, 'DOCTOR', userId);

    expect(tx.queueEntry.updateMany).toHaveBeenCalledWith({
      where: {
        id: waiting.id,
        tenantId,
        branchId,
        status: 'WAITING',
      },
      data: { status: 'CALLING' },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'QUEUE_ENTRY_CALLED',
        oldValues: { status: 'WAITING' },
        newValues: { status: 'CALLING' },
      }),
      tx,
      branchId,
    );
    expect(result).toEqual(calling);
  });

  it('retries with the next candidate when another counter wins the claim race', async () => {
    const first = { id: 'entry-1', status: 'WAITING' };
    const second = { id: 'entry-2', status: 'WAITING' };
    const claimedSecond = { ...second, status: 'CALLING' };
    tx.branch.findFirst.mockResolvedValue({ id: branchId });
    tx.queueEntry.findFirst
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second)
      .mockResolvedValueOnce(claimedSecond);
    tx.queueEntry.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });

    const result = await service.callNext(tenantId, branchId, 'DOCTOR', userId);

    expect(tx.queueEntry.updateMany).toHaveBeenCalledTimes(2);
    expect(result.id).toBe('entry-2');
  });

  it('rejects call-next when no patient is waiting', async () => {
    tx.branch.findFirst.mockResolvedValue({ id: branchId });
    tx.queueEntry.findFirst.mockResolvedValue(null);

    await expect(
      service.callNext(tenantId, branchId, 'DOCTOR', userId),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects completion of an entry from another branch', async () => {
    tx.queueEntry.findFirst.mockResolvedValue(null);

    await expect(
      service.completeEntry(tenantId, branchId, 'entry-1', userId),
    ).rejects.toThrow(NotFoundException);

    expect(tx.queueEntry.findFirst).toHaveBeenCalledWith({
      where: { id: 'entry-1', tenantId, branchId },
    });
    expect(tx.queueEntry.updateMany).not.toHaveBeenCalled();
  });

  it('completes through a compare-and-swap transition and writes an audit event', async () => {
    const calling = { id: 'entry-1', status: 'CALLING' };
    const completed = { ...calling, status: 'COMPLETED' };
    tx.queueEntry.findFirst
      .mockResolvedValueOnce(calling)
      .mockResolvedValueOnce(completed);
    tx.queueEntry.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.completeEntry(
      tenantId,
      branchId,
      calling.id,
      userId,
    );

    expect(tx.queueEntry.updateMany).toHaveBeenCalledWith({
      where: {
        id: calling.id,
        tenantId,
        branchId,
        status: 'CALLING',
      },
      data: { status: 'COMPLETED' },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'QUEUE_ENTRY_COMPLETED',
        oldValues: { status: 'CALLING' },
        newValues: { status: 'COMPLETED' },
      }),
      tx,
      branchId,
    );
    expect(result).toEqual(completed);
  });

  it('fails safely if an entry changes during completion', async () => {
    tx.queueEntry.findFirst.mockResolvedValue({
      id: 'entry-1',
      status: 'CALLING',
    });
    tx.queueEntry.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.completeEntry(tenantId, branchId, 'entry-1', userId),
    ).rejects.toThrow(ConflictException);
  });

  it('returns queue statistics from one grouped database snapshot', async () => {
    prisma.queueEntry.groupBy.mockResolvedValue([
      { status: 'WAITING', _count: { _all: 3 } },
      { status: 'CALLING', _count: { _all: 1 } },
      { status: 'COMPLETED', _count: { _all: 9 } },
    ]);

    await expect(service.getQueueStats(tenantId, branchId)).resolves.toEqual({
      waiting: 3,
      calling: 1,
      served: 9,
      skipped: 0,
    });
  });
});
