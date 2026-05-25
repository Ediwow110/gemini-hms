import { Test, TestingModule } from '@nestjs/testing';
import { ItSupportService } from './it-support.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ItSupportService', () => {
  let service: ItSupportService;
  let prisma: any;
  let audit: any;

  const mockPrisma = {
    supportTicket: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockAudit = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItSupportService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<ItSupportService>(ItSupportService);
    prisma = module.get(PrismaService);
    audit = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      issueType: 'LOGIN_FAILURE' as any,
      summary: 'Cannot login after password change',
      description: 'User locked out',
      priority: 'HIGH' as any,
    };
    const tenantId = 'tenant-1';
    const userId = 'user-1';

    it('should create a ticket and log audit', async () => {
      const mockTicket = {
        id: 'ticket-1',
        ...dto,
        tenantId,
        reportedById: userId,
      };
      mockPrisma.supportTicket.create.mockResolvedValue(mockTicket);

      const result = await service.create(dto, tenantId, userId);

      expect(mockPrisma.supportTicket.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          reportedById: userId,
          branchId: null,
          issueType: dto.issueType,
          summary: dto.summary,
          description: dto.description,
          priority: 'HIGH',
        },
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'SUPPORT_TICKET_CREATED' }),
        undefined,
        undefined,
      );
      expect(result).toEqual(mockTicket);
    });
  });

  describe('findAll', () => {
    it('should return paginated tickets', async () => {
      const mockTickets = [{ id: 'ticket-1', summary: 'Test' }];
      mockPrisma.supportTicket.count.mockResolvedValue(1);
      mockPrisma.supportTicket.findMany.mockResolvedValue(mockTickets);

      const result = await service.findAll(
        'tenant-1',
        'user-1',
        ['IT Support'],
        {},
      );

      expect(result.data).toEqual(mockTickets);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if ticket not found', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue(null);
      await expect(
        service.findOne('bad-id', 'tenant-1', 'user-1', ['IT Support']),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if tenant mismatch', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue({
        id: 'ticket-1',
        tenantId: 'other-tenant',
        reportedById: 'user-1',
      });
      await expect(
        service.findOne('ticket-1', 'tenant-1', 'user-1', ['IT Support']),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return ticket for IT Support role', async () => {
      const mockTicket = {
        id: 'ticket-1',
        tenantId: 'tenant-1',
        reportedById: 'user-2',
        reportedBy: { id: 'user-2', email: 'test@test.com' },
        assignedTo: null,
        branch: null,
      };
      mockPrisma.supportTicket.findUnique.mockResolvedValue(mockTicket);
      const result = await service.findOne('ticket-1', 'tenant-1', 'user-1', [
        'IT Support',
      ]);
      expect(result).toEqual(mockTicket);
    });

    it('should throw ForbiddenException for non-IT Support non-owner', async () => {
      const mockTicket = {
        id: 'ticket-1',
        tenantId: 'tenant-1',
        reportedById: 'user-2',
      };
      mockPrisma.supportTicket.findUnique.mockResolvedValue(mockTicket);
      await expect(
        service.findOne('ticket-1', 'tenant-1', 'user-1', ['Nurse']),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update ticket and log audit', async () => {
      const existing = {
        id: 'ticket-1',
        tenantId: 'tenant-1',
        status: 'OPEN',
        priority: 'MEDIUM',
        branchId: 'branch-1',
      };
      mockPrisma.supportTicket.findUnique.mockResolvedValue(existing);
      mockPrisma.supportTicket.update.mockResolvedValue({
        ...existing,
        status: 'IN_PROGRESS',
      });

      const result = await service.update(
        'ticket-1',
        { status: 'IN_PROGRESS' as any },
        'tenant-1',
        'user-1',
      );

      expect(mockPrisma.supportTicket.update).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
        data: { status: 'IN_PROGRESS' },
      });
      expect(mockAudit.log).toHaveBeenCalled();
    });

    it('should set resolvedAt when status is RESOLVED', async () => {
      const existing = {
        id: 'ticket-1',
        tenantId: 'tenant-1',
        status: 'OPEN',
        priority: 'MEDIUM',
      };
      mockPrisma.supportTicket.findUnique.mockResolvedValue(existing);
      mockPrisma.supportTicket.update.mockResolvedValue({
        ...existing,
        status: 'RESOLVED',
        resolvedAt: new Date(),
      });

      await service.update(
        'ticket-1',
        { status: 'RESOLVED' as any, resolution: 'Fixed' },
        'tenant-1',
        'user-1',
      );

      expect(mockPrisma.supportTicket.update).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
        data: expect.objectContaining({
          status: 'RESOLVED',
          resolvedAt: expect.any(Date),
          resolution: 'Fixed',
        }),
      });
    });
  });

  describe('getStats', () => {
    it('should return ticket stats', async () => {
      mockPrisma.supportTicket.count.mockResolvedValueOnce(5); // open
      mockPrisma.supportTicket.count.mockResolvedValueOnce(3); // inProgress
      mockPrisma.supportTicket.count.mockResolvedValueOnce(1); // urgent
      mockPrisma.supportTicket.count.mockResolvedValueOnce(20); // total

      const result = await service.getStats('tenant-1');
      expect(result).toEqual({ open: 5, inProgress: 3, urgent: 1, total: 20 });
    });
  });
});
