import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
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
