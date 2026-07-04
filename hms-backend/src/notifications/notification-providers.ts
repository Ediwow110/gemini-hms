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

export function maskEmail(email: string): string {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const mailbox = parts[0];
  const domain = parts[1];
  if (mailbox.length <= 2) {
    return `${mailbox}*****@${domain}`;
  }
  return `${mailbox.substring(0, 2)}*****@${domain}`;
}

export function maskPhone(phone: string): string {
  if (!phone) return '';
  if (phone.length <= 5) return phone;
  const prefix = phone.substring(0, 3);
  const suffix = phone.substring(phone.length - 2);
  return `${prefix}*****${suffix}`;
}

// ---------------------------------------------------------
// Mock Providers — explicitly local-dev / sandbox only.
// These are isolated by name; the factory refuses to use them
// in NODE_ENV=production. Do not rely on these for real
// notification delivery.
// ---------------------------------------------------------

export class MockEmailProvider implements EmailProvider {
  async sendEmail(payload: EmailPayload) {
    console.log(
      `[MockEmailProvider] Sending email to ${maskEmail(payload.to)}: ${payload.subject}`,
    );
    return { success: true, messageId: `mock-email-${Date.now()}` };
  }
}

export class MockSmsProvider implements SmsProvider {
  async sendSms(payload: SmsPayload) {
    console.log(
      `[MockSmsProvider] Sending SMS to ${maskPhone(payload.to)}: ${payload.body.substring(0, 50)}...`,
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
// Real Providers — honest, gated stubs.
// These provider classes are reserved for the real external
// integrations. Until the real HTTP / SDK calls are wired, each
// provider throws an explicit "not implemented" error so the
// production API never reports a fake delivery success.
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
  async sendEmail(_payload: EmailPayload): Promise<never> {
    throw new InternalServerErrorException(
      'Mailrelay email delivery is not yet implemented in this release. ' +
        'Wire the real Mailrelay HTTP/SMTP integration before relying on this ' +
        'provider for clinical notifications.',
    );
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
  async sendEmail(_payload: EmailPayload): Promise<never> {
    throw new InternalServerErrorException(
      'AWS SES email delivery is not yet implemented in this release. ' +
        'Wire the real AWS SES SDK call before relying on this provider for ' +
        'clinical notifications.',
    );
  }
}

export class SemaphoreProvider implements SmsProvider {
  constructor() {
    if (!process.env.SEMAPHORE_API_KEY) {
      throw new InternalServerErrorException('SEMAPHORE_API_KEY is missing');
    }
  }
  async sendSms(_payload: SmsPayload): Promise<never> {
    throw new InternalServerErrorException(
      'Semaphore SMS delivery is not yet implemented in this release. ' +
        'Wire the real Semaphore HTTP call before relying on this provider ' +
        'for clinical notifications.',
    );
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

    if (providerStr === 'mock') {
      if (
        process.env.NODE_ENV !== 'development' &&
        process.env.NODE_ENV !== 'test'
      ) {
        throw new InternalServerErrorException(
          `EMAIL_PROVIDER=mock is not allowed in ${process.env.NODE_ENV || 'current'} environment. ` +
            'Configure a real provider (mailrelay, ses) before proceeding to staging or production.',
        );
      }
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
      if (
        process.env.NODE_ENV !== 'development' &&
        process.env.NODE_ENV !== 'test'
      ) {
        throw new InternalServerErrorException(
          `SMS_PROVIDER=mock is not allowed in ${process.env.NODE_ENV || 'current'} environment. ` +
            'Configure a real provider (semaphore) before proceeding to staging or production.',
        );
      }
      return new MockSmsProvider();
    }

    throw new InternalServerErrorException(
      `Invalid SMS_PROVIDER configured: ${providerStr}`,
    );
  }
}
