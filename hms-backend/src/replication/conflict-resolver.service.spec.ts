import { Test, TestingModule } from '@nestjs/testing';
import { ConflictResolverService } from './conflict-resolver.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ServiceUnavailableException } from '@nestjs/common';

describe('ConflictResolverService', () => {
  let service: ConflictResolverService;
  let auditService: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConflictResolverService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConflictResolverService>(ConflictResolverService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.NODE_ENV;
    delete process.env.REPLICATION_ENABLED;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveConflict', () => {
    it('should throw ServiceUnavailableException in production if REPLICATION_ENABLED is not true', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REPLICATION_ENABLED = 'false';

      await expect(
        service.resolveConflict(
          'tenant-1',
          'user-1',
          'Patient',
          'record-1',
          {} as any,
          {} as any,
        ),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('should resolve conflict and log audit if REPLICATION_ENABLED is true', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REPLICATION_ENABLED = 'true';

      const stateA = {
        region: 'us-east-1',
        updatedAt: '2023-01-01T00:00:00Z',
        updatedBy: 'user1',
        payload: { a: 1 },
      };
      const stateB = {
        region: 'eu-west-1',
        updatedAt: '2023-01-01T01:00:00Z',
        updatedBy: 'user2',
        payload: { b: 2 },
      };

      const result = await service.resolveConflict(
        'tenant-1',
        'user-1',
        'Patient',
        'record-1',
        stateA,
        stateB,
      );

      expect(result.winningRegion).toBe('eu-west-1');
      expect(result.strategy).toBe('LAST_WRITE_WINS');
      expect(result.isStub).toBe(false);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          userId: 'user-1',
          eventKey: 'MULTI_REGION_CONFLICT_RESOLVED',
          recordType: 'Patient',
          recordId: 'record-1',
        }),
      );
    });

    it('should return isStub: true and not log audit if REPLICATION_ENABLED is not true in dev', async () => {
      process.env.NODE_ENV = 'development';
      process.env.REPLICATION_ENABLED = 'false';

      const stateA = {
        region: 'us-east-1',
        updatedAt: '2023-01-01T00:00:00Z',
        updatedBy: 'user1',
        payload: { a: 1 },
      };
      const stateB = {
        region: 'eu-west-1',
        updatedAt: '2023-01-01T01:00:00Z',
        updatedBy: 'user2',
        payload: { b: 2 },
      };

      const result = await service.resolveConflict(
        'tenant-1',
        'user-1',
        'Patient',
        'record-1',
        stateA,
        stateB,
      );

      expect(result.isStub).toBe(true);

      expect(auditService.log).not.toHaveBeenCalled();
    });
  });

  describe('detectConflicts', () => {
    it('should throw ServiceUnavailableException in production if REPLICATION_ENABLED is not true', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REPLICATION_ENABLED = 'false';

      await expect(
        service.detectConflicts('tenant-1', 'Patient'),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('should return isStub: true in development if not enabled', async () => {
      process.env.NODE_ENV = 'development';

      const result = await service.detectConflicts('tenant-1', 'Patient');
      expect(result[0].isStub).toBe(true);
    });
  });

  describe('syncRecord', () => {
    it('should throw ServiceUnavailableException in production if REPLICATION_ENABLED is not true', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REPLICATION_ENABLED = 'false';

      await expect(
        service.syncRecord(
          'tenant-1',
          'user-1',
          'Patient',
          'record-1',
          'eu-west-1',
        ),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('should return isStub: true and not log audit if REPLICATION_ENABLED is not true in dev', async () => {
      process.env.NODE_ENV = 'development';
      process.env.REPLICATION_ENABLED = 'false';

      const result = await service.syncRecord(
        'tenant-1',
        'user-1',
        'Patient',
        'record-1',
        'eu-west-1',
      );

      expect(result.isStub).toBe(true);
      expect(result.status).toBe('STUBBED');

      expect(auditService.log).not.toHaveBeenCalled();
    });
  });
});
