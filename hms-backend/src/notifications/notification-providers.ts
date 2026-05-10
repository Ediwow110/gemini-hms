import { InternalServerErrorException } from '@nestjs/common';

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export interface SmsPayload {
  to: string;
  body: string;
}

export interface EmailProvider {
  sendEmail(
    payload: EmailPayload,
  ): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export interface SmsProvider {
  sendSms(
    payload: SmsPayload,
  ): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// ---------------------------------------------------------
// Mock Providers
// ---------------------------------------------------------

export class MockEmailProvider implements EmailProvider {
  async sendEmail(payload: EmailPayload) {
    console.log(
      `[MockEmailProvider] Sending email to ${payload.to}: ${payload.subject}`,
    );
    return { success: true, messageId: `mock-email-${Date.now()}` };
  }
}

export class MockSmsProvider implements SmsProvider {
  async sendSms(payload: SmsPayload) {
    console.log(
      `[MockSmsProvider] Sending SMS to ${payload.to}: ${payload.body.substring(0, 50)}...`,
    );
    return { success: true, messageId: `mock-sms-${Date.now()}` };
  }
}

export class FailingMockEmailProvider implements EmailProvider {
  async sendEmail(_payload: EmailPayload) {
    return { success: false, error: 'SMTP connection refused (mock failure)' };
  }
}

// ---------------------------------------------------------
// Real Providers (Placeholders)
// ---------------------------------------------------------

export class MailrelayProvider implements EmailProvider {
  constructor() {
    if (!process.env.MAILRELAY_API_KEY && !process.env.MAILRELAY_SMTP_PASS) {
      throw new InternalServerErrorException(
        'Mailrelay API Key or SMTP Pass is missing',
      );
    }
    if (!process.env.MAILRELAY_SENDER_EMAIL) {
      throw new InternalServerErrorException(
        'MAILRELAY_SENDER_EMAIL is missing',
      );
    }
    if (!process.env.MAILRELAY_SENDER_NAME) {
      throw new InternalServerErrorException(
        'MAILRELAY_SENDER_NAME is missing',
      );
    }
  }
  async sendEmail(payload: EmailPayload) {
    // In future: Actual mailrelay integration logic
    console.log(`[MailrelayProvider] Sending email to ${payload.to}`);
    return { success: true, messageId: `mailrelay-${Date.now()}` };
  }
}

export class SesProvider implements EmailProvider {
  constructor() {
    if (!process.env.AWS_REGION) {
      throw new InternalServerErrorException(
        'AWS_REGION is missing for SES provider',
      );
    }
    if (!process.env.SES_SENDER_EMAIL) {
      throw new InternalServerErrorException('SES_SENDER_EMAIL is missing');
    }
  }
  async sendEmail(payload: EmailPayload) {
    console.log(`[SesProvider] Sending email to ${payload.to}`);
    return { success: true, messageId: `ses-${Date.now()}` };
  }
}

export class SemaphoreProvider implements SmsProvider {
  constructor() {
    if (!process.env.SEMAPHORE_API_KEY) {
      throw new InternalServerErrorException('SEMAPHORE_API_KEY is missing');
    }
  }
  async sendSms(payload: SmsPayload) {
    console.log(`[SemaphoreProvider] Sending SMS to ${payload.to}`);
    return { success: true, messageId: `semaphore-${Date.now()}` };
  }
}

// ---------------------------------------------------------
// Factory Abstracting Configuration Validation
// ---------------------------------------------------------

export class NotificationProviderFactory {
  static createEmailProvider(): EmailProvider {
    const providerStr = (process.env.EMAIL_PROVIDER || 'mock').toLowerCase();

    if (providerStr === 'mailrelay') {
      return new MailrelayProvider();
    }
    if (providerStr === 'ses') {
      return new SesProvider();
    }

    // Fail-safe: only allow mock in dev/test, though we permit it explicitly via env config here.
    if (providerStr === 'mock') {
      return new MockEmailProvider();
    }

    throw new InternalServerErrorException(
      `Invalid EMAIL_PROVIDER configured: ${providerStr}`,
    );
  }

  static createSmsProvider(): SmsProvider {
    const providerStr = (process.env.SMS_PROVIDER || 'mock').toLowerCase();

    if (providerStr === 'semaphore') {
      return new SemaphoreProvider();
    }

    if (providerStr === 'mock') {
      return new MockSmsProvider();
    }

    throw new InternalServerErrorException(
      `Invalid SMS_PROVIDER configured: ${providerStr}`,
    );
  }
}
