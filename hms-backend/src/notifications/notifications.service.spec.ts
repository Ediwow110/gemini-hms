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

describe('Provider Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('allows mock provider in development', () => {
    process.env.EMAIL_PROVIDER = 'mock';
    const provider = NotificationProviderFactory.createEmailProvider();
    expect(provider).toBeInstanceOf(MockEmailProvider);
  });

  it('rejects mock provider in production (no fake success in live envs)', () => {
    process.env.EMAIL_PROVIDER = 'mock';
    process.env.NODE_ENV = 'production';
    expect(() => {
      NotificationProviderFactory.createEmailProvider();
    }).toThrow('EMAIL_PROVIDER=mock is not allowed in production environment. Configure a real provider (mailrelay, ses) before proceeding to staging or production.');
  });

  it('rejects mock SMS provider in production', () => {
    process.env.SMS_PROVIDER = 'mock';
    process.env.NODE_ENV = 'production';
    expect(() => {
      NotificationProviderFactory.createSmsProvider();
    }).toThrow('SMS_PROVIDER=mock is not allowed in production environment. Configure a real provider (semaphore) before proceeding to staging or production.');
  });

  it('fails if mailrelay is missing credentials', () => {
    process.env.EMAIL_PROVIDER = 'mailrelay';
    delete process.env.MAILRELAY_API_KEY;
    delete process.env.MAILRELAY_SMTP_PASS;
    expect(() => {
      NotificationProviderFactory.createEmailProvider();
    }).toThrow('Mailrelay API Key or SMTP Pass is missing');
  });

  it('fails if ses is missing credentials', () => {
    process.env.EMAIL_PROVIDER = 'ses';
    delete process.env.AWS_REGION;
    expect(() => {
      NotificationProviderFactory.createEmailProvider();
    }).toThrow('AWS_REGION is missing for SES provider');
  });

  it('MailrelayProvider.sendEmail throws honest "not implemented" instead of fake success', async () => {
    process.env.EMAIL_PROVIDER = 'mailrelay';
    process.env.MAILRELAY_API_KEY = 'test-key';
    process.env.MAILRELAY_SENDER_EMAIL = 'noreply@hms.local';
    process.env.MAILRELAY_SENDER_NAME = 'HMS';
    const provider = NotificationProviderFactory.createEmailProvider();
    await expect(
      provider.sendEmail({
        to: 'patient@hms.local',
        subject: 'Test',
        body: 'Hello',
      }),
    ).rejects.toThrow('Mailrelay email delivery is not yet implemented');
  });

  it('SesProvider.sendEmail throws honest "not implemented" instead of fake success', async () => {
    process.env.EMAIL_PROVIDER = 'ses';
    process.env.AWS_REGION = 'ap-southeast-1';
    process.env.SES_SENDER_EMAIL = 'noreply@hms.local';
    const provider = NotificationProviderFactory.createEmailProvider();
    await expect(
      provider.sendEmail({
        to: 'patient@hms.local',
        subject: 'Test',
        body: 'Hello',
      }),
    ).rejects.toThrow('AWS SES email delivery is not yet implemented');
  });

  it('SemaphoreProvider.sendSms throws honest "not implemented" instead of fake success', async () => {
    process.env.SMS_PROVIDER = 'semaphore';
    process.env.SEMAPHORE_API_KEY = 'test-key';
    const provider = NotificationProviderFactory.createSmsProvider();
    await expect(
      provider.sendSms({ to: '+639171234567', body: 'Test' }),
    ).rejects.toThrow('Semaphore SMS delivery is not yet implemented');
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
