import { Test, TestingModule } from '@nestjs/testing';
import { NotImplementedException, BadRequestException } from '@nestjs/common';
import { StorageService } from './storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

type MulterFile = Express.Multer.File;

describe('StorageService', () => {
  let service: StorageService;
  let prisma: any;
  let audit: any;
  let config: any;

  const mockFile = (overrides: Partial<MulterFile> = {}): MulterFile => ({
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('test content'),
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
    ...overrides,
  });

  beforeEach(async () => {
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.STORAGE_DRIVER = 'local';
    process.env.LOCAL_STORAGE_UPLOAD_DIR = './test-uploads';

    prisma = {
      $transaction: jest.fn(async (cb) => {
        const mockTx = { auditLog: { create: jest.fn() } };
        return cb(mockTx);
      }),
    };

    audit = {
      log: jest.fn().mockResolvedValue({}),
    };

    config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          STORAGE_DRIVER: 'local',
          LOCAL_STORAGE_UPLOAD_DIR: './test-uploads',
          LOCAL_STORAGE_PUBLIC_URL_BASE: 'http://localhost:3000',
          JWT_SECRET: 'a'.repeat(32),
        };
        return values[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload a valid PDF file to local storage', async () => {
      const file = mockFile({ mimetype: 'application/pdf', size: 1024 });
      const result = await service.uploadFile(file, 'uploads', 'user-1', 'tenant-1');

      expect(result).toMatchObject({
        bucket: 'local',
        mimeType: 'application/pdf',
        size: 1024,
      });
      expect(result.key).toMatch(/^uploads\/\d+-[a-f0-9]{8}\.pdf$/);
      expect(result.hash).toHaveLength(64);
    });

    it('should upload a valid JPEG file', async () => {
      const file = mockFile({ mimetype: 'image/jpeg', size: 2048, originalname: 'photo.jpg' });
      const result = await service.uploadFile(file, 'images', 'user-1', 'tenant-1');

      expect(result).toMatchObject({
        bucket: 'local',
        mimeType: 'image/jpeg',
        size: 2048,
      });
      expect(result.key).toMatch(/^images\/\d+-[a-f0-9]{8}\.jpg$/);
    });

    it('should upload a valid PNG file', async () => {
      const file = mockFile({ mimetype: 'image/png', size: 512, originalname: 'image.png' });
      const result = await service.uploadFile(file, 'uploads', 'user-1', 'tenant-1');

      expect(result.mimeType).toBe('image/png');
      expect(result.key).toMatch(/\.png$/);
    });

    it('should reject disallowed MIME type', async () => {
      const file = mockFile({ mimetype: 'application/x-executable', size: 1024 });

      await expect(
        service.uploadFile(file, 'uploads', 'user-1', 'tenant-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject file exceeding size limit for PDF', async () => {
      const file = mockFile({
        mimetype: 'application/pdf',
        size: 60 * 1024 * 1024, // 60MB > 50MB limit
      });

      await expect(
        service.uploadFile(file, 'uploads', 'user-1', 'tenant-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow DICOM file within 500MB limit', async () => {
      const file = mockFile({
        mimetype: 'application/dicom',
        size: 400 * 1024 * 1024, // 400MB < 500MB limit for DICOM
      });

      const result = await service.uploadFile(file, 'dicom', 'user-1', 'tenant-1');
      expect(result).toBeDefined();
      expect(result.size).toBe(400 * 1024 * 1024);
    });

    it('should reject DICOM file exceeding 500MB', async () => {
      const file = mockFile({
        mimetype: 'application/dicom',
        size: 600 * 1024 * 1024,
      });

      await expect(
        service.uploadFile(file, 'dicom', 'user-1', 'tenant-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should generate SHA-256 hash correctly', async () => {
      const file = mockFile({ buffer: Buffer.from('consistent content') });
      const result = await service.uploadFile(file, 'uploads', 'user-1', 'tenant-1');

      // Verify hash matches expected SHA-256
      const expectedHash = createHash('sha256').update('consistent content').digest('hex');
      expect(result.hash).toBe(expectedHash);
    });

    it('should log upload event to audit log', async () => {
      const file = mockFile({ mimetype: 'application/pdf', size: 1024 });
      await service.uploadFile(file, 'uploads', 'user-1', 'tenant-1');

      // Check the last call (FILE_UPLOADED)
      const calls = audit.log.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).toMatchObject({
        eventKey: 'FILE_UPLOADED',
        recordType: 'File',
        recordId: expect.any(String),
        newValues: expect.objectContaining({
          key: expect.any(String),
          bucket: 'local',
          size: 1024,
          mimeType: 'application/pdf',
        }),
      });
      expect(lastCall[3]).toMatchObject({
        ipAddress: 'storage-service',
        userAgent: 'Local file upload',
      });
    });
  });

  describe('getSignedUrl', () => {
    it('should generate a signed URL for local storage', async () => {
      const url = await service.getSignedUrl('uploads/test.pdf', 3600, 'user-1', 'tenant-1');

      expect(url).toContain('http://localhost:3000/api/v1/storage/files/');
      expect(url).toContain('expires=');
      expect(url).toContain('token=');
    });

    it('should log download event when generating signed URL', async () => {
      await service.getSignedUrl('uploads/test.pdf', 3600, 'user-1', 'tenant-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'FILE_DOWNLOADED',
          recordType: 'File',
          recordId: 'uploads/test.pdf',
        }),
        expect.anything(),
      );
    });

    it('should use custom expiry time', async () => {
      const url = await service.getSignedUrl('uploads/test.pdf', 7200, 'user-1', 'tenant-1');

      const expiresMatch = url.match(/expires=(\d+)/);
      expect(expiresMatch).toBeTruthy();
      const expires = parseInt(expiresMatch![1], 10);
      const now = Math.floor(Date.now() / 1000);
      expect(expires - now).toBeGreaterThan(7100);
      expect(expires - now).toBeLessThan(7300);
    });
  });

  describe('deleteFile', () => {
    it('should delete file from local storage and log audit event', async () => {
      // First create a test file
      const file = mockFile({ mimetype: 'application/pdf', size: 1024 });
      const uploadResult = await service.uploadFile(file, 'uploads', 'user-1', 'tenant-1');
      
      await service.deleteFile(uploadResult.key, 'user-1', 'tenant-1');

      // Check the last call (FILE_DELETED)
      const calls = audit.log.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).toMatchObject({
        eventKey: 'FILE_DELETED',
        recordType: 'File',
        recordId: uploadResult.key,
        newValues: expect.objectContaining({
          key: uploadResult.key,
          bucket: 'local',
          deleted: true,
        }),
      });
      expect(lastCall[3]).toMatchObject({
        ipAddress: 'storage-service',
        userAgent: 'Local delete operation',
      });
    }, 10000);
  });

  describe('logDownload', () => {
    it('should log download event with correct parameters', async () => {
      await service.logDownload('report.pdf', 'user-1', 'tenant-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'FILE_DOWNLOADED',
          recordType: 'File',
          recordId: 'report.pdf',
          newValues: { fileKey: 'report.pdf' },
        }),
        expect.anything(),
      );
    });
  });

  describe('getFileMetadata', () => {
    it('should return null for non-existent file in local storage', async () => {
      const metadata = await service.getFileMetadata('nonexistent.pdf');
      expect(metadata).toBeNull();
    });
  });

  describe('getDriver', () => {
    it('should return "local" when STORAGE_DRIVER=local', () => {
      expect(service.getDriver()).toBe('local');
    });

    it('should return "s3" when STORAGE_DRIVER=s3', async () => {
      process.env.STORAGE_DRIVER = 's3';
      process.env.AWS_S3_REGION = 'us-east-1';
      process.env.AWS_S3_BUCKET = 'test-bucket';
      process.env.AWS_S3_ACCESS_KEY_ID = 'access-key';
      process.env.AWS_S3_SECRET_ACCESS_KEY = 'secret-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          { provide: PrismaService, useValue: prisma },
          { provide: AuditService, useValue: audit },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const values: Record<string, string> = {
                  STORAGE_DRIVER: 's3',
                  AWS_S3_REGION: 'us-east-1',
                  AWS_S3_BUCKET: 'test-bucket',
                  AWS_S3_ACCESS_KEY_ID: 'access-key',
                  AWS_S3_SECRET_ACCESS_KEY: 'secret-key',
                };
                return values[key];
              }),
            },
          },
        ],
      }).compile();

      const s3Service = module.get<StorageService>(StorageService);
      expect(s3Service.getDriver()).toBe('s3');
    });
  });
});