import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('StorageService', () => {
  let service: StorageService;
  let prisma: PrismaService;
  let audit: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(async (cb) => {
              const mockTx = { auditLog: { create: jest.fn() } };
              return cb(mockTx);
            }),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    prisma = module.get<PrismaService>(PrismaService);
    audit = module.get<AuditService>(AuditService);
  });

  it('should generate a signed URL with expiry', async () => {
    const url = await service.generateSignedUrl(
      'test-file.pdf',
      'user-1',
      'tenant-1',
      3600,
    );

    expect(url).toContain('test-file.pdf');
    expect(url).toContain('sig=');
    expect(url).toContain('exp=');
  });

  it('should log download event', async () => {
    await service.logDownload('report.pdf', 'user-1', 'tenant-1');

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'FILE_DOWNLOADED',
        recordType: 'File',
        recordId: 'report.pdf',
      }),
      expect.anything(),
    );
  });
});
