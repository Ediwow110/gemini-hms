import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import {
  SmsService,
  formatE164,
  sanitizeMessage,
  maskPhone,
} from './sms.service';
import { EmailService, maskEmail } from './email.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  renderTemplate,
  NOTIFICATION_TEMPLATES,
} from './notification-templates';
import {
  MockEmailProvider,
  MockSmsProvider,
  FailingMockEmailProvider,
  NotificationProviderFactory,
} from './notification-providers';
import { AUDIT_EVENT_KEYS } from '../audit/audit-event-keys';

function requestBodyToText(body: BodyInit | null | undefined): string {
  if (typeof body === 'string') return body;
  if (body instanceof URLSearchParams) return body.toString();
  throw new Error('Expected a string or URLSearchParams request body.');
}

describe('NotificationsService write isolation', () => {
  let service: NotificationsService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: {
            notification: {
              findFirst: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  const tenantId = 'tenant-1';
  const notificationId = 'notif-123';
  const viewerUserId = 'user-aa';

  it('should reject markAsRead when tenant does not match row', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.markAsRead(notificationId, tenantId, viewerUserId),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: {
        id: notificationId,
        tenantId,
        OR: [{ userId: null }, { userId: viewerUserId }],
      },
      data: { status: 'READ', readAt: expect.any(Date) },
    });
  });

  it('should reject markAsRead for user-targeted notification when viewer is wrong', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.markAsRead(notificationId, tenantId, 'other-user'),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: {
        id: notificationId,
        tenantId,
        OR: [{ userId: null }, { userId: 'other-user' }],
      },
      data: { status: 'READ', readAt: expect.any(Date) },
    });
  });
});

describe('Notification Templates', () => {
  it('RESULT_READY template contains no PHI', () => {
    const { subject, body } = renderTemplate('RESULT_READY', {
      patientName: 'Juan Dela Cruz',
      hospitalName: 'HMS Core Medical Center',
      portalUrl: 'https://portal.hmscore.ph',
    });

    expect(body).not.toContain('positive');
    expect(body).not.toContain('negative');
    expect(body).not.toContain('CBC');
    expect(body).not.toContain('diagnosis');

    expect(body).toContain('secure document is available');
    expect(body).toContain('patient portal');
    expect(body).toContain('privacy and security');
    expect(subject).toBe('A Secure Document Is Available');
  });

  it('LOW_STOCK_ALERT uses item name and SKU, no patient data', () => {
    const { subject, body } = renderTemplate('LOW_STOCK_ALERT', {
      itemName: 'Paracetamol 500mg',
      itemSku: 'DRUG-001',
      currentStock: 5,
      reorderLevel: '10',
    });

    expect(body).toContain('Paracetamol 500mg');
    expect(body).toContain('DRUG-001');
    expect(body).toContain('5');
    expect(body).not.toContain('patient');
    expect(subject).toContain('LOW STOCK ALERT');
  });

  it('all templates have containsPhi set to false', () => {
    for (const template of Object.values(NOTIFICATION_TEMPLATES)) {
      expect(template.containsPhi).toBe(false);
    }
  });

  it('PAYMENT_CONFIRMATION renders placeholders', () => {
    const { body } = renderTemplate('PAYMENT_CONFIRMATION', {
      patientName: 'Maria Santos',
      amount: '₱1,500.00',
      receiptNumber: 'RCT-MAIN-2026-00100',
      portalUrl: 'https://portal.hmscore.ph',
    });

    expect(body).toContain('₱1,500.00');
    expect(body).toContain('RCT-MAIN-2026-00100');
  });
});

describe('Mock Providers', () => {
  it('MockEmailProvider sends successfully', async () => {
    const provider = new MockEmailProvider();
    const result = await provider.sendEmail({
      to: 'test@hospital.com',
      subject: 'Test',
      body: 'Hello',
    });
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it('MockSmsProvider sends successfully', async () => {
    const provider = new MockSmsProvider();
    const result = await provider.sendSms({
      to: '+639171234567',
      body: 'Test SMS message',
    });
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it('FailingMockEmailProvider fails', async () => {
    const provider = new FailingMockEmailProvider();
    const result = await provider.sendEmail({
      to: 'test@hospital.com',
      subject: 'Test',
      body: 'Hello',
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('connection refused');
  });
});

describe('Provider Validation and Delivery', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'test' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('allows mock provider in development', () => {
    process.env.EMAIL_PROVIDER = 'mock';
    const provider = NotificationProviderFactory.createEmailProvider();
    expect(provider).toBeInstanceOf(MockEmailProvider);
  });

  it('rejects mock email and SMS providers in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.EMAIL_PROVIDER = 'mock';
    process.env.SMS_PROVIDER = 'mock';

    expect(() => NotificationProviderFactory.createEmailProvider()).toThrow(
      'EMAIL_PROVIDER=mock is not allowed in production environment.',
    );
    expect(() => NotificationProviderFactory.createSmsProvider()).toThrow(
      'SMS_PROVIDER=mock is not allowed in production environment.',
    );
  });

  it('fails closed when Mailrelay TLS SMTP credentials are incomplete', () => {
    process.env.EMAIL_PROVIDER = 'mailrelay';
    delete process.env.MAILRELAY_SMTP_HOST;

    expect(() => NotificationProviderFactory.createEmailProvider()).toThrow(
      'MAILRELAY_SMTP_HOST is required.',
    );
  });

  it('fails closed when SES signing credentials are incomplete', () => {
    process.env.EMAIL_PROVIDER = 'ses';
    process.env.AWS_REGION = 'ap-southeast-1';
    process.env.SES_SENDER_EMAIL = 'noreply@hms.local';
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;

    expect(() => NotificationProviderFactory.createEmailProvider()).toThrow(
      'AWS_ACCESS_KEY_ID is required.',
    );
  });

  it('Mailrelay rejects invalid recipient input before opening a connection', async () => {
    process.env.EMAIL_PROVIDER = 'mailrelay';
    process.env.MAILRELAY_SMTP_HOST = 'smtp.example.com';
    process.env.MAILRELAY_SMTP_PORT = '465';
    process.env.MAILRELAY_SMTP_USER = 'smtp-user';
    process.env.MAILRELAY_SMTP_PASS = 'smtp-password';
    process.env.MAILRELAY_SENDER_EMAIL = 'noreply@hms.local';
    process.env.MAILRELAY_SENDER_NAME = 'HMS';
    const provider = NotificationProviderFactory.createEmailProvider();

    await expect(
      provider.sendEmail({
        to: 'invalid-address',
        subject: 'Test',
        body: 'Hello',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        success: false,
        error: 'Recipient email address is invalid.',
      }),
    );
  });

  it('SES signs and sends a real HTTPS API request', async () => {
    process.env.EMAIL_PROVIDER = 'ses';
    process.env.AWS_REGION = 'ap-southeast-1';
    process.env.SES_SENDER_EMAIL = 'noreply@hms.local';
    process.env.AWS_ACCESS_KEY_ID = 'AKIATEST';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-access-key';
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ MessageId: 'ses-message-1' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const provider = NotificationProviderFactory.createEmailProvider();

    await expect(
      provider.sendEmail({
        to: 'patient@hms.local',
        subject: 'Result ready',
        body: 'Your result is ready.',
      }),
    ).resolves.toEqual({ success: true, messageId: 'ses-message-1' });

    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://email.ap-southeast-1.amazonaws.com/v2/email/outbound-emails',
    );
    expect(request?.headers).toEqual(
      expect.objectContaining({
        authorization: expect.stringContaining('AWS4-HMAC-SHA256 Credential='),
      }),
    );
    expect(requestBodyToText(request?.body)).toContain('patient@hms.local');
    fetchMock.mockRestore();
  });

  it('Semaphore submits an HTTPS form and returns the provider message ID', async () => {
    process.env.SMS_PROVIDER = 'semaphore';
    process.env.SEMAPHORE_API_KEY = 'test-key';
    process.env.SEMAPHORE_SENDER_NAME = 'HMS';
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ message_id: 'sms-message-1' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const provider = NotificationProviderFactory.createSmsProvider();

    await expect(
      provider.sendSms({ to: '+639171234567', body: 'Test' }),
    ).resolves.toEqual({ success: true, messageId: 'sms-message-1' });

    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.semaphore.co/api/v4/messages');
    const requestBody = requestBodyToText(request?.body);
    expect(requestBody).toContain('apikey=test-key');
    expect(requestBody).toContain('number=%2B639171234567');
    fetchMock.mockRestore();
  });
});

describe('NotificationsService ePHI Masking', () => {
  it('should correctly mask email addresses', () => {
    expect(NotificationsService.maskEmail('patient@gmail.com')).toBe(
      'pa*****@gmail.com',
    );
    expect(NotificationsService.maskEmail('ab@domain.com')).toBe(
      'ab*****@domain.com',
    );
    expect(NotificationsService.maskEmail('a@domain.com')).toBe(
      'a*****@domain.com',
    );
    expect(NotificationsService.maskEmail('')).toBe('');
  });

  it('should correctly mask phone numbers', () => {
    expect(NotificationsService.maskPhone('+639171234567')).toBe('+63*****67');
    expect(NotificationsService.maskPhone('+1234567890')).toBe('+12*****90');
    expect(NotificationsService.maskPhone('123')).toBe('123');
    expect(NotificationsService.maskPhone('')).toBe('');
  });
});

// ===== SMS SERVICE TESTS =====
describe('SmsService', () => {
  let service: SmsService;
  let prisma: any;
  let audit: any;
  let config: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        { provide: PrismaService, useValue: {} },
        {
          provide: AuditService,
          useValue: { logSystemEvent: jest.fn().mockResolvedValue({}) },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const env: Record<string, string> = {
                SMS_PROVIDER: 'logger',
                NODE_ENV: 'test',
              };
              return env[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
    prisma = module.get<PrismaService>(PrismaService);
    audit = module.get<AuditService>(AuditService);
    config = module.get(ConfigService);
  });

  it('should create SmsService instance', () => {
    expect(service).toBeDefined();
  });

  it('should send SMS via logger provider in test environment', async () => {
    const result = await service.sendSms(
      '+639171234567',
      'Test message',
      'tenant-1',
      'user-1',
    );

    expect(result.success).toBe(true);
    expect(result.messageId).toMatch(/^logger-sms-/);
  });

  it('should format phone numbers to E.164', async () => {
    // Test Philippine mobile format
    const result1 = await service.sendSms('09171234567', 'Test', 'tenant-1');
    expect(result1.success).toBe(true);

    // Test US format
    const result2 = await service.sendSms('5551234567', 'Test', 'tenant-1');
    expect(result2.success).toBe(true);

    // Test already E.164
    const result3 = await service.sendSms('+15551234567', 'Test', 'tenant-1');
    expect(result3.success).toBe(true);
  });

  it('should sanitize PHI from messages', async () => {
    const messageWithPhi =
      'Patient P-1234 has MRN-56789 and DOB: 01/15/1990 and SSN 123-45-6789';
    // The sanitization happens internally, we verify the service doesn't throw
    const result = await service.sendSms(
      '+639171234567',
      messageWithPhi,
      'tenant-1',
    );
    expect(result.success).toBe(true);
  });

  it('should log SMS_SENT audit event on success', async () => {
    await service.sendSms(
      '+639171234567',
      'Test message',
      'tenant-1',
      'user-1',
    );

    expect(audit.logSystemEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        eventKey: AUDIT_EVENT_KEYS.SMS_SENT,
        recordType: 'Notification',
      }),
    );
  });

  it('should log SMS_FAILED audit event on failure', async () => {
    // Create service with failing provider
    const failingModule: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        { provide: PrismaService, useValue: {} },
        {
          provide: AuditService,
          useValue: { logSystemEvent: jest.fn().mockResolvedValue({}) },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SMS_PROVIDER') return 'logger';
              if (key === 'NODE_ENV') return 'test';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    const failingService = failingModule.get<SmsService>(SmsService);
    // Override driver to fail
    (failingService as any).driver = {
      sendSms: jest.fn().mockResolvedValue({ success: false, error: 'Failed' }),
    };

    const result = await failingService.sendSms(
      '+639171234567',
      'Test',
      'tenant-1',
    );
    expect(result.success).toBe(false);

    const auditService = failingModule.get<AuditService>(AuditService);
    expect(auditService.logSystemEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: AUDIT_EVENT_KEYS.SMS_FAILED,
      }),
    );
  });

  it('should send appointment confirmation SMS', async () => {
    const result = await service.sendAppointmentConfirmation(
      'tenant-1',
      '+639171234567',
      'Juan Dela Cruz',
      '2024-01-15',
      '10:00 AM',
      'Main Clinic',
    );
    expect(result.success).toBe(true);
  });

  it('should send lab result ready SMS (PHI-safe)', async () => {
    const result = await service.sendLabResultReady(
      'tenant-1',
      '+639171234567',
      'Maria Santos',
      'https://portal.hospital.com',
    );
    expect(result.success).toBe(true);
  });

  it('should send payment confirmation SMS', async () => {
    const result = await service.sendPaymentConfirmation(
      'tenant-1',
      '+639171234567',
      'Pedro Reyes',
      '₱1,500.00',
      'RCT-2024-001',
    );
    expect(result.success).toBe(true);
  });
});

// ===== EMAIL SERVICE TESTS =====
describe('EmailService', () => {
  let service: EmailService;
  let prisma: any;
  let audit: any;
  let config: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: PrismaService, useValue: {} },
        {
          provide: AuditService,
          useValue: { logSystemEvent: jest.fn().mockResolvedValue({}) },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const env: Record<string, string> = {
                EMAIL_PROVIDER: 'logger',
                NODE_ENV: 'test',
              };
              return env[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    prisma = module.get<PrismaService>(PrismaService);
    audit = module.get<AuditService>(AuditService);
    config = module.get(ConfigService);
  });

  it('should create EmailService instance', () => {
    expect(service).toBeDefined();
  });

  it('should send email via logger provider in test environment', async () => {
    const result = await service.sendEmail(
      'patient@hospital.com',
      'Test Subject',
      '<h1>Test Body</h1>',
      'tenant-1',
    );

    expect(result.success).toBe(true);
    expect(result.messageId).toMatch(/^logger-email-/);
  });

  it('should validate email payload', async () => {
    // Invalid email format
    const result1 = await service.sendEmail(
      'invalid-email',
      'Subject',
      'Body',
      'tenant-1',
    );
    expect(result1.success).toBe(false);
    expect(result1.error).toContain('invalid');

    // Empty body
    const result2 = await service.sendEmail(
      'test@hospital.com',
      'Subject',
      '',
      'tenant-1',
    );
    expect(result2.success).toBe(false);
  });

  it('should log EMAIL_SENT audit event on success', async () => {
    await service.sendEmail(
      'patient@hospital.com',
      'Subject',
      '<p>Body</p>',
      'tenant-1',
    );

    expect(audit.logSystemEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        eventKey: AUDIT_EVENT_KEYS.EMAIL_SENT,
        recordType: 'Notification',
      }),
    );
  });

  it('should log EMAIL_FAILED audit event on failure', async () => {
    // Create service with failing driver
    const failingModule: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: PrismaService, useValue: {} },
        {
          provide: AuditService,
          useValue: { logSystemEvent: jest.fn().mockResolvedValue({}) },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'EMAIL_PROVIDER') return 'logger';
              if (key === 'NODE_ENV') return 'test';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    const failingService = failingModule.get<EmailService>(EmailService);
    (failingService as any).driver = {
      sendEmail: jest
        .fn()
        .mockResolvedValue({ success: false, error: 'Failed' }),
    };

    const result = await failingService.sendEmail(
      'test@hospital.com',
      'Subject',
      'Body',
      'tenant-1',
    );
    expect(result.success).toBe(false);

    const auditService = failingModule.get<AuditService>(AuditService);
    expect(auditService.logSystemEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: AUDIT_EVENT_KEYS.EMAIL_FAILED,
      }),
    );
  });
});

// ===== SMS UTILITY FUNCTION TESTS =====
describe('SMS Utility Functions', () => {
  it('formatE164 should handle Philippine numbers', () => {
    expect(formatE164('09171234567')).toBe('+639171234567');
    expect(formatE164('639171234567')).toBe('+639171234567');
    expect(formatE164('+639171234567')).toBe('+639171234567');
  });

  it('formatE164 should handle US numbers', () => {
    expect(formatE164('5551234567')).toBe('+15551234567');
    expect(formatE164('+15551234567')).toBe('+15551234567');
  });

  it('sanitizeMessage should remove PHI patterns', () => {
    expect(sanitizeMessage('Patient P-1234 test')).toBe(
      'Patient [PATIENT_ID] test',
    );
    expect(sanitizeMessage('MRN-56789 check')).toBe('[MRN] check');
    expect(sanitizeMessage('SSN 123-45-6789')).toBe('SSN [SSN]');
    expect(sanitizeMessage('Card 1234-5678-9012-3456')).toBe('Card [CARD]');
  });

  it('maskPhone should mask phone numbers for logging', () => {
    expect(maskPhone('+639171234567')).toBe('+63*****67');
    expect(maskPhone('+15551234567')).toBe('+15*****67');
    expect(maskPhone('123')).toBe('*****');
  });
});

// ===== EMAIL UTILITY FUNCTION TESTS =====
describe('Email Utility Functions', () => {
  it('maskEmail should mask email addresses for logging', () => {
    expect(maskEmail('patient@gmail.com')).toBe('pa*****@gmail.com');
    expect(maskEmail('ab@domain.com')).toBe('ab*****@domain.com');
    expect(maskEmail('a@domain.com')).toBe('a*****@domain.com');
    expect(maskEmail('')).toBe('');
    expect(maskEmail('invalid')).toBe('invalid-email');
  });
});
