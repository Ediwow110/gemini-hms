import {
  Injectable,
  NotImplementedException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Multer } from 'multer';

export interface UploadResult {
  key: string;
  bucket: string;
  hash: string;
  size: number;
  mimeType: string;
}

export interface StorageConfig {
  driver: 's3' | 'local';
  s3?: {
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
    forcePathStyle?: boolean;
    publicUrlBase?: string;
  };
  local?: {
    uploadDir: string;
    publicUrlBase?: string;
  };
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/dicom',
  'image/jpeg',
  'image/png',
  'image/dicom-rle',
  'image/dicom-jpeg',
]);

const MAX_FILE_SIZES: Record<string, number> = {
  'application/pdf': 50 * 1024 * 1024,
  'application/dicom': 500 * 1024 * 1024,
  'image/jpeg': 50 * 1024 * 1024,
  'image/png': 50 * 1024 * 1024,
  'image/dicom-rle': 500 * 1024 * 1024,
  'image/dicom-jpeg': 500 * 1024 * 1024,
};

const DEFAULT_MAX_SIZE = 50 * 1024 * 1024;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly config: StorageConfig;
  private s3Client: S3Client | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {
    this.config = this.buildConfig();
    this.initializeDriver();
  }

  private buildConfig(): StorageConfig {
    const driver = (this.configService.get<string>('STORAGE_DRIVER') || 'local') as
      | 's3'
      | 'local';

    if (driver === 's3') {
      const region = this.configService.get<string>('AWS_S3_REGION');
      const bucket = this.configService.get<string>('AWS_S3_BUCKET');
      const accessKeyId = this.configService.get<string>('AWS_S3_ACCESS_KEY_ID');
      const secretAccessKey = this.configService.get<string>('AWS_S3_SECRET_ACCESS_KEY');

      if (!region || !bucket || !accessKeyId || !secretAccessKey) {
        throw new Error(
          'S3 storage driver requires AWS_S3_REGION, AWS_S3_BUCKET, AWS_S3_ACCESS_KEY_ID, and AWS_S3_SECRET_ACCESS_KEY',
        );
      }

      return {
        driver: 's3',
        s3: {
          region,
          bucket,
          accessKeyId,
          secretAccessKey,
          endpoint: this.configService.get<string>('AWS_S3_ENDPOINT'),
          forcePathStyle:
            this.configService.get<string>('AWS_S3_FORCE_PATH_STYLE') === 'true',
          publicUrlBase: this.configService.get<string>('AWS_S3_PUBLIC_URL_BASE'),
        },
      };
    }

    return {
      driver: 'local',
      local: {
        uploadDir: this.configService.get<string>('LOCAL_STORAGE_UPLOAD_DIR') || './uploads',
        publicUrlBase: this.configService.get<string>('LOCAL_STORAGE_PUBLIC_URL_BASE'),
      },
    };
  }

  private initializeDriver(): void {
    if (this.config.driver === 's3' && this.config.s3) {
      this.s3Client = new S3Client({
        region: this.config.s3.region,
        credentials: {
          accessKeyId: this.config.s3.accessKeyId,
          secretAccessKey: this.config.s3.secretAccessKey,
        },
        endpoint: this.config.s3.endpoint,
        forcePathStyle: this.config.s3.forcePathStyle ?? false,
      });
      this.logger.log('S3 storage driver initialized');
    } else {
      this.ensureLocalUploadDir();
      this.logger.log('Local storage driver initialized');
    }
  }

  private async ensureLocalUploadDir(): Promise<void> {
    if (this.config.local?.uploadDir) {
      await fs.mkdir(this.config.local.uploadDir, { recursive: true });
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${Array.from(ALLOWED_MIME_TYPES).join(', ')}`,
      );
    }

    const maxSize = MAX_FILE_SIZES[file.mimetype] || DEFAULT_MAX_SIZE;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size ${file.size} bytes exceeds maximum allowed size of ${maxSize} bytes for type ${file.mimetype}`,
      );
    }
  }

  private generateFileKey(file: Express.Multer.File, prefix: string = 'uploads'): string {
    const timestamp = Date.now();
    const randomSuffix = createHash('sha256')
      .update(`${timestamp}-${Math.random()}`)
      .digest('hex')
      .substring(0, 8);
    const extension = path.extname(file.originalname) || '';
    return `${prefix}/${timestamp}-${randomSuffix}${extension}`;
  }

  private computeSha256(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  async uploadFile(
    file: Express.Multer.File,
    pathPrefix: string = 'uploads',
    userId: string,
    tenantId: string,
  ): Promise<UploadResult> {
    this.validateFile(file);

    const key = this.generateFileKey(file, pathPrefix);
    const hash = this.computeSha256(file.buffer);

    if (this.config.driver === 's3' && this.s3Client && this.config.s3) {
      return this.uploadToS3(file, key, hash, userId, tenantId);
    }

    return this.uploadToLocal(file, key, hash, userId, tenantId);
  }

  private async uploadToS3(
    file: Express.Multer.File,
    key: string,
    hash: string,
    userId: string,
    tenantId: string,
  ): Promise<UploadResult> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.config.s3!.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          'x-phi-hash': hash,
          'x-phi-uploaded-by': userId,
          'x-phi-tenant-id': tenantId,
          'x-phi-original-name': file.originalname,
        },
        Tagging: `phi=true&hash=${hash}&tenant=${tenantId}`,
      });

      await this.s3Client!.send(command);

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'FILE_UPLOADED',
          recordType: 'File',
          recordId: key,
          newValues: {
            key,
            bucket: this.config.s3!.bucket,
            size: file.size,
            mimeType: file.mimetype,
            hash,
          },
        },
        undefined,
        undefined,
        { ipAddress: 'storage-service', userAgent: 'S3 upload operation' },
      );

      this.logger.log(`File uploaded to S3: ${key} (hash: ${hash})`);

      return {
        key,
        bucket: this.config.s3!.bucket,
        hash,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      this.logger.error(`S3 upload failed: ${error}`);
      throw new InternalServerErrorException('Failed to upload file to S3');
    }
  }

  private async uploadToLocal(
    file: Express.Multer.File,
    key: string,
    hash: string,
    userId: string,
    tenantId: string,
  ): Promise<UploadResult> {
    try {
      const uploadDir = this.config.local!.uploadDir;
      const fullPath = path.join(uploadDir, key);

      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, file.buffer);

      const metadataPath = `${fullPath}.meta.json`;
      await fs.writeFile(
        metadataPath,
        JSON.stringify({
          hash,
          mimeType: file.mimetype,
          originalName: file.originalname,
          uploadedBy: userId,
          tenantId,
          uploadedAt: new Date().toISOString(),
        }),
      );

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'FILE_UPLOADED',
          recordType: 'File',
          recordId: key,
          newValues: {
            key,
            bucket: 'local',
            size: file.size,
            mimeType: file.mimetype,
            hash,
          },
        },
        undefined,
        undefined,
        { ipAddress: 'storage-service', userAgent: 'Local file upload' },
      );

      this.logger.log(`File uploaded to local storage: ${key} (hash: ${hash})`);

      return {
        key,
        bucket: 'local',
        hash,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      this.logger.error(`Local upload failed: ${error}`);
      throw new InternalServerErrorException('Failed to upload file to local storage');
    }
  }

  async getSignedUrl(
    key: string,
    expiresInSeconds: number = 3600,
    userId: string,
    tenantId: string,
  ): Promise<string> {
    await this.logDownload(key, userId, tenantId);

    if (this.config.driver === 's3' && this.s3Client && this.config.s3) {
      return this.getS3SignedUrl(key, expiresInSeconds);
    }

    return this.getLocalSignedUrl(key, expiresInSeconds);
  }

  private async getS3SignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.s3!.bucket,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client!, command, {
        expiresIn: expiresInSeconds,
      });

      if (this.config.s3!.publicUrlBase) {
        const url = new URL(signedUrl);
        return `${this.config.s3!.publicUrlBase}${url.pathname}${url.search}`;
      }

      return signedUrl;
    } catch (error) {
      this.logger.error(`S3 signed URL generation failed: ${error}`);
      throw new InternalServerErrorException('Failed to generate signed URL');
    }
  }

  private async getLocalSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    const baseUrl = this.config.local?.publicUrlBase || 'http://localhost:3000';
    const expiry = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const token = createHash('sha256')
      .update(`${key}:${expiry}:${this.configService.get<string>('JWT_SECRET')}`)
      .digest('hex')
      .substring(0, 32);

    return `${baseUrl}/api/v1/storage/files/${encodeURIComponent(key)}?expires=${expiry}&token=${token}`;
  }

  async deleteFile(key: string, userId: string, tenantId: string): Promise<void> {
    if (this.config.driver === 's3' && this.s3Client && this.config.s3) {
      await this.deleteFromS3(key, userId, tenantId);
    } else {
      await this.deleteFromLocal(key, userId, tenantId);
    }
  }

  private async deleteFromS3(key: string, userId: string, tenantId: string): Promise<void> {
    try {
      await this.s3Client!.send(
        new DeleteObjectCommand({
          Bucket: this.config.s3!.bucket,
          Key: key,
        }),
      );

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'FILE_DELETED',
          recordType: 'File',
          recordId: key,
          newValues: { key, bucket: this.config.s3!.bucket, deleted: true },
        },
        undefined,
        undefined,
        { ipAddress: 'storage-service', userAgent: 'S3 delete operation' },
      );

      this.logger.log(`File deleted from S3: ${key}`);
    } catch (error) {
      this.logger.error(`S3 delete failed: ${error}`);
      throw new InternalServerErrorException('Failed to delete file from S3');
    }
  }

  private async deleteFromLocal(key: string, userId: string, tenantId: string): Promise<void> {
    try {
      const uploadDir = this.config.local!.uploadDir;
      const fullPath = path.join(uploadDir, key);
      const metadataPath = `${fullPath}.meta.json`;

      await fs.unlink(fullPath).catch(() => {});
      await fs.unlink(metadataPath).catch(() => {});

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'FILE_DELETED',
          recordType: 'File',
          recordId: key,
          newValues: { key, bucket: 'local', deleted: true },
        },
        undefined,
        undefined,
        { ipAddress: 'storage-service', userAgent: 'Local delete operation' },
      );

      this.logger.log(`File deleted from local storage: ${key}`);
    } catch (error) {
      this.logger.error(`Local delete failed: ${error}`);
      throw new InternalServerErrorException('Failed to delete file from local storage');
    }
  }

  async logDownload(fileKey: string, userId: string, tenantId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'FILE_DOWNLOADED',
          recordType: 'File',
          recordId: fileKey,
          newValues: { fileKey },
        },
        tx,
      );
    });
  }

  async getFileMetadata(key: string): Promise<{ hash: string; mimeType: string; size: number } | null> {
    if (this.config.driver === 's3' && this.s3Client && this.config.s3) {
      return this.getS3FileMetadata(key);
    }

    return this.getLocalFileMetadata(key);
  }

  private async getS3FileMetadata(key: string): Promise<{ hash: string; mimeType: string; size: number } | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.s3!.bucket,
        Key: key,
      });

      const response = await this.s3Client!.send(command);

      return {
        hash: response.Metadata?.['x-phi-hash'] || '',
        mimeType: response.ContentType || 'application/octet-stream',
        size: response.ContentLength || 0,
      };
    } catch (error) {
      this.logger.warn(`S3 head object failed for ${key}: ${error}`);
      return null;
    }
  }

  private async getLocalFileMetadata(key: string): Promise<{ hash: string; mimeType: string; size: number } | null> {
    try {
      const uploadDir = this.config.local!.uploadDir;
      const metadataPath = path.join(uploadDir, `${key}.meta.json`);

      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataContent);

      const fullPath = path.join(uploadDir, key);
      const stats = await fs.stat(fullPath);

      return {
        hash: metadata.hash,
        mimeType: metadata.mimeType,
        size: stats.size,
      };
    } catch (error) {
      this.logger.warn(`Local metadata read failed for ${key}: ${error}`);
      return null;
    }
  }

  getDriver(): 's3' | 'local' {
    return this.config.driver;
  }

  getConfig(): StorageConfig {
    return { ...this.config };
  }
}