/**
 * Provider interfaces and mock implementations for notification dispatch.
 * Designed so real adapters (MailrelayAdapter, SesAdapter, TwilioAdapter)
 * can be swapped in later without changing the dispatcher.
 */

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

/**
 * Mock Email Provider — logs to console, always succeeds.
 * Replace with MailrelayAdapter or SesAdapter when ready.
 */
export class MockEmailProvider implements EmailProvider {
  async sendEmail(payload: EmailPayload) {
    console.log(
      `[MockEmailProvider] Sending email to ${payload.to}: ${payload.subject}`,
    );
    return { success: true, messageId: `mock-email-${Date.now()}` };
  }
}

/**
 * Mock SMS Provider — logs to console, always succeeds.
 * Replace with TwilioAdapter or SemaphoreAdapter when ready.
 */
export class MockSmsProvider implements SmsProvider {
  async sendSms(payload: SmsPayload) {
    console.log(
      `[MockSmsProvider] Sending SMS to ${payload.to}: ${payload.body.substring(0, 50)}...`,
    );
    return { success: true, messageId: `mock-sms-${Date.now()}` };
  }
}

/**
 * Failing Mock Provider — for testing retry logic.
 */
export class FailingMockEmailProvider implements EmailProvider {
  async sendEmail(_payload: EmailPayload) {
    return { success: false, error: 'SMTP connection refused (mock failure)' };
  }
}
