import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AUDIT_EVENT_KEYS } from '../audit/audit-event-keys';
import { SmsPayload, DeliveryResult } from './notification-providers';
import { randomUUID } from 'crypto';

/**
 * SMS Provider Interface - extends the base SmsProvider
 */
export interface SmsDriver {
  sendSms(payload: SmsPayload): Promise<DeliveryResult>;
}

/**
 * Twilio SMS Provider (Global)
 * Uses @twilio/node-sdk
 */
export class TwilioSmsProvider implements SmsDriver {
  private readonly logger = new Logger(TwilioSmsProvider.name);
  private client: any; // Twilio client (lazy loaded)

  constructor(
    private readonly accountSid: string,
    private readonly authToken: string,
    private readonly fromNumber: string,
  ) {}

  private getClient() {
    if (!this.client) {
      const twilio = require('twilio');
      this.client = twilio(this.accountSid, this.authToken);
    }
    return this.client;
  }

  async sendSms(payload: SmsPayload): Promise<DeliveryResult> {
    try {
      validateSmsPayload(payload);
      const client = this.getClient();

      const message = await client.messages.create({
        body: payload.body,
        from: this.fromNumber,
        to: formatE164(payload.to),
      });

      return { success: true, messageId: message.sid };
    } catch (error) {
      this.logger.error(`Twilio SMS send failed: ${error.message}`);
      return {
        success: false,
        error: `Twilio delivery failed: ${error.message}`,
      };
    }
  }
}

/**
 * Semaphore SMS Provider (Philippines)
 * Uses HTTPS form POST to api.semaphore.co
 */
export class SemaphoreSmsProvider implements SmsDriver {
  private readonly logger = new Logger(SemaphoreSmsProvider.name);

  constructor(
    private readonly apiKey: string,
    private readonly endpoint: string = 'https://api.semaphore.co/api/v4/messages',
    private readonly senderName?: string,
  ) {}

  async sendSms(payload: SmsPayload): Promise<DeliveryResult> {
    try {
      validateSmsPayload(payload);

      const form = new URLSearchParams({
        apikey: this.apiKey,
        number: formatE164(payload.to),
        message: payload.body,
      });

      if (this.senderName) {
        form.set('sendername', this.senderName);
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: form,
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        throw new Error(`Semaphore returned HTTP ${response.status}`);
      }

      const result = (await response.json()) as unknown;
      const first = Array.isArray(result) ? result[0] : result;
      const messageId = this.extractMessageId(first);

      if (!messageId) {
        throw new Error('Semaphore response did not include a message ID');
      }

      return { success: true, messageId };
    } catch (error) {
      this.logger.error(`Semaphore SMS send failed: ${error.message}`);
      return {
        success: false,
        error: `Semaphore delivery failed: ${error.message}`,
      };
    }
  }

  private extractMessageId(value: unknown): string | undefined {
    if (!value || typeof value !== 'object') return undefined;
    const record = value as Record<string, unknown>;
    return (record.message_id as string) || (record.messageId as string);
  }
}

/**
 * Logger SMS Provider (Development/Testing)
 * Logs to console instead of sending
 */
export class LoggerSmsProvider implements SmsDriver {
  private readonly logger = new Logger(LoggerSmsProvider.name);

  async sendSms(payload: SmsPayload): Promise<DeliveryResult> {
    this.logger.log(
      `[LoggerSmsProvider] SMS to ${maskPhone(payload.to)} (${payload.body.length} chars): ${sanitizeMessage(payload.body)}`,
    );
    return { success: true, messageId: `logger-sms-${randomUUID()}` };
  }
}

/**
 * SMS Service - Main entry point for sending SMS notifications
 * Supports configurable providers with audit logging and PHI sanitization
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly driver: SmsDriver;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {
    this.driver = this.createDriver();
  }

  private createDriver(): SmsDriver {
    const provider = (this.config.get<string>('SMS_PROVIDER') || 'logger').toLowerCase();

    switch (provider) {
      case 'twilio': {
        const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
        const fromNumber = this.config.get<string>('TWILIO_FROM_NUMBER');

        if (!accountSid || !authToken || !fromNumber) {
          throw new InternalServerErrorException(
            'Twilio provider requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER',
          );
        }
        return new TwilioSmsProvider(accountSid, authToken, fromNumber);
      }

      case 'semaphore': {
        const apiKey = this.config.get<string>('SEMAPHORE_API_KEY');
        const endpoint = this.config.get<string>('SEMAPHORE_API_URL');
        const senderName = this.config.get<string>('SEMAPHORE_SENDER_NAME');

        if (!apiKey) {
          throw new InternalServerErrorException(
            'Semaphore provider requires SEMAPHORE_API_KEY',
          );
        }
        return new SemaphoreSmsProvider(apiKey, endpoint, senderName);
      }

      case 'logger':
      default: {
        if (this.config.get<string>('NODE_ENV') === 'production') {
          throw new InternalServerErrorException(
            'SMS_PROVIDER=logger is not allowed in production. Use "twilio" or "semaphore".',
          );
        }
        return new LoggerSmsProvider();
      }
    }
  }

  /**
   * Send an SMS message with audit logging and PHI sanitization
   * @param to - Destination phone number (will be formatted to E.164)
   * @param message - Message body (will be sanitized)
   * @param tenantId - Tenant ID for audit logging
   * @param userId - Optional user ID who initiated the send
   * @param context - Optional audit context (IP, user agent, etc.)
   */
  async sendSms(
    to: string,
    message: string,
    tenantId: string,
    userId?: string,
    context?: { ipAddress?: string; userAgent?: string },
  ): Promise<DeliveryResult> {
    // Format phone number to E.164
    const formattedTo = formatE164(to);

    // Sanitize message to remove ePHI/patient identifiers
    const sanitizedMessage = sanitizeMessage(message);

    const payload: SmsPayload = {
      to: formattedTo,
      body: sanitizedMessage,
    };

    this.logger.log(`Sending SMS to ${maskPhone(formattedTo)} via ${this.driver.constructor.name}`);

    const result = await this.driver.sendSms(payload);

    // Audit logging
    try {
      await this.audit.logSystemEvent({
        tenantId,
        eventKey: result.success ? AUDIT_EVENT_KEYS.SMS_SENT : AUDIT_EVENT_KEYS.SMS_FAILED,
        recordType: 'Notification',
        recordId: result.messageId || `sms-${Date.now()}`,
        newValues: {
          to: maskPhone(formattedTo),
          bodyLength: sanitizedMessage.length,
          provider: this.driver.constructor.name,
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        },
      });
    } catch (auditError) {
      this.logger.warn(`Failed to log SMS audit event: ${auditError.message}`);
    }

    return result;
  }

  /**
   * Send appointment confirmation SMS
   */
  async sendAppointmentConfirmation(
    tenantId: string,
    patientPhone: string,
    patientName: string,
    appointmentDate: string,
    appointmentTime: string,
    clinicName: string,
    userId?: string,
  ): Promise<DeliveryResult> {
    const message = `Hi ${patientName}, your appointment at ${clinicName} is confirmed for ${appointmentDate} at ${appointmentTime}. Reply STOP to opt out.`;
    return this.sendSms(patientPhone, message, tenantId, userId);
  }

  /**
   * Send lab result ready notification SMS (PHI-safe - no result values)
   */
  async sendLabResultReady(
    tenantId: string,
    patientPhone: string,
    patientName: string,
    portalUrl: string,
    userId?: string,
  ): Promise<DeliveryResult> {
    const message = `Hi ${patientName}, your lab results are ready. View securely at ${portalUrl}. Reply STOP to opt out.`;
    return this.sendSms(patientPhone, message, tenantId, userId);
  }

  /**
   * Send payment confirmation SMS
   */
  async sendPaymentConfirmation(
    tenantId: string,
    patientPhone: string,
    patientName: string,
    amount: string,
    receiptNumber: string,
    userId?: string,
  ): Promise<DeliveryResult> {
    const message = `Hi ${patientName}, payment of ${amount} received. Receipt: ${receiptNumber}. Reply STOP to opt out.`;
    return this.sendSms(patientPhone, message, tenantId, userId);
  }
}

/**
 * Format phone number to E.164 standard (+CCXXXXXXXXXX)
 */
export function formatE164(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Already in E.164 format
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Philippines numbers: assume +63 if starts with 09 or 639
  if (cleaned.startsWith('09') || cleaned.startsWith('639')) {
    return cleaned.startsWith('09') ? `+63${cleaned.slice(1)}` : `+${cleaned}`;
  }

  // US/Canada: assume +1 if 10 digits
  if (cleaned.length === 10 && /^\d{10}$/.test(cleaned)) {
    return `+1${cleaned}`;
  }

  // If it starts with a country code digit (1-9) and no +
  if (/^[1-9]\d{7,14}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // Default: return as-is with + prefix if missing
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * Sanitize SMS message to remove ePHI and sensitive patient identifiers
 */
export function sanitizeMessage(message: string): string {
  let sanitized = message;

  // Remove potential PHI patterns
  // Patient IDs (P-XXXX, PAT-XXXX, etc.)
  sanitized = sanitized.replace(/\bP(?:atient)?[-_ ]?\d{3,}\b/gi, '[PATIENT_ID]');
  // Medical record numbers (MRN-XXXX)
  sanitized = sanitized.replace(/\bMRN[-_ ]?\d{3,}\b/gi, '[MRN]');
  // Dates of birth in message
  sanitized = sanitized.replace(/\b(?:DOB|Date of Birth)[:]\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/gi, '[DOB]');
  // Social security / national ID patterns
  sanitized = sanitized.replace(/\b\d{3}[-_]?\d{2}[-_]?\d{4}\b/g, '[SSN]');
  // Credit card numbers
  sanitized = sanitized.replace(/\b\d{4}[-_\s]?\d{4}[-_\s]?\d{4}[-_\s]?\d{4}\b/g, '[CARD]');

  return sanitized;
}

/**
 * Validate SMS payload
 */
function validateSmsPayload(payload: SmsPayload): void {
  if (!payload.to || !/^\+?[1-9]\d{7,14}$/.test(payload.to.replace(/[\s\-\(\)]/g, ''))) {
    throw new Error('Recipient phone number is invalid.');
  }
  if (!payload.body?.trim()) {
    throw new Error('SMS body cannot be empty.');
  }
  if (payload.body.length > 1600) {
    throw new Error('SMS body is too long (max 1600 characters).');
  }
}

/**
 * Mask phone number for logging
 */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  if (phone.length <= 5) return '*****';
  return `${phone.substring(0, 3)}*****${phone.substring(phone.length - 2)}`;
}
