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

describe('Notification Templates', () => {
  it('RESULT_READY template contains no PHI', () => {
    const { subject, body } = renderTemplate('RESULT_READY', {
      patientName: 'Juan Dela Cruz',
      hospitalName: 'HMS Core Medical Center',
      portalUrl: 'https://portal.hmscore.ph',
    });

    // Must NOT contain lab values, diagnoses, test names
    expect(body).not.toContain('positive');
    expect(body).not.toContain('negative');
    expect(body).not.toContain('CBC');
    expect(body).not.toContain('diagnosis');

    // Must contain safe portal wording
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
});
