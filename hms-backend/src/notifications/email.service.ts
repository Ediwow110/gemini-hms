import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AUDIT_EVENT_KEYS } from '../audit/audit-event-keys';
import { EmailPayload, DeliveryResult } from './notification-providers';
import { validateEmailPayload } from './notification-providers';
import { randomUUID } from 'crypto';

/**
 * Email Provider Interface
 */
export interface EmailDriver {
  sendEmail(payload: EmailPayload): Promise<DeliveryResult>;
}

/**
 * AWS SES Email Provider
 * Uses @aws-sdk/client-ses
 */
export class SesEmailProvider implements EmailDriver {
  private readonly logger = new Logger(SesEmailProvider.name);
  private sesClient: any; // Lazy loaded SES client

  constructor(
    private readonly region: string,
    private readonly senderEmail: string,
    private readonly accessKeyId: string,
    private readonly secretAccessKey: string,
    private readonly sessionToken?: string,
  ) {}

  private async getClient() {
    if (!this.sesClient) {
      const { SESv2Client } = await import('@aws-sdk/client-sesv2');
      this.sesClient = new SESv2Client({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
          sessionToken: this.sessionToken,
        },
      });
    }
    return this.sesClient;
  }

  async sendEmail(payload: EmailPayload): Promise<DeliveryResult> {
    try {
      validateEmailPayload(payload);

      const { SendEmailCommand } = await import('@aws-sdk/client-sesv2');
      const client = await this.getClient();

      const command = new SendEmailCommand({
        FromEmailAddress: this.senderEmail,
        Destination: {
          ToAddresses: [payload.to],
        },
        Content: {
          Simple: {
            Subject: {
              Data: payload.subject,
              Charset: 'UTF-8',
            },
            Body: {
              Html: {
                Data: payload.body,
                Charset: 'UTF-8',
              },
              Text: {
                Data: this.htmlToText(payload.body),
                Charset: 'UTF-8',
              },
            },
          },
        },
      });

      const response = await client.send(command);
      return { success: true, messageId: response.MessageId };
    } catch (error) {
      this.logger.error(`AWS SES send failed: ${error.message}`);
      return {
        success: false,
        error: `SES delivery failed: ${error.message}`,
      };
    }
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

/**
 * SendGrid Email Provider
 * Uses @sendgrid/mail
 */
export class SendGridEmailProvider implements EmailDriver {
  private readonly logger = new Logger(SendGridEmailProvider.name);
  private sgMail: any; // Lazy loaded

  constructor(
    private readonly apiKey: string,
    private readonly senderEmail: string,
    private readonly senderName: string = 'HMS Notifications',
  ) {}

  private getClient() {
    if (!this.sgMail) {
      const sgMail = await import('@sendgrid/mail');
      this.sgMail = sgMail.default;
      this.sgMail.setApiKey(this.apiKey);
    }
    return this.sgMail;
  }

  async sendEmail(payload: EmailPayload): Promise<DeliveryResult> {
    try {
      validateEmailPayload(payload);
      const sgMail = this.getClient();

      const msg = {
        to: payload.to,
        from: { email: this.senderEmail, name: this.senderName },
        subject: payload.subject,
        html: payload.body,
        text: this.htmlToText(payload.body),
      };

      const response = await sgMail.send(msg);
      // SendGrid returns an array of responses, first element has messageId in headers
      const messageId =
        response[0]?.headers?.['x-message-id'] || `sendgrid-${randomUUID()}`;

      return { success: true, messageId };
    } catch (error) {
      this.logger.error(`SendGrid send failed: ${error.message}`);
      return {
        success: false,
        error: `SendGrid delivery failed: ${error.message}`,
      };
    }
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

/**
 * Nodemailer SMTP Provider (for custom SMTP servers)
 */
export class NodemailerEmailProvider implements EmailDriver {
  private readonly logger = new Logger(NodemailerEmailProvider.name);
  private transporter: any; // Lazy loaded

  constructor(
    private readonly host: string,
    private readonly port: number,
    private readonly username: string,
    private readonly password: string,
    private readonly senderEmail: string,
    private readonly senderName: string = 'HMS Notifications',
    private readonly secure: boolean = true,
  ) {}

  private async getTransporter() {
    if (!this.transporter) {
      const nodemailer = await import('nodemailer');
      this.transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.secure,
        auth: {
          user: this.username,
          pass: this.password,
        },
        tls: {
          rejectUnauthorized: true,
          minVersion: 'TLSv1.2',
        },
      });
    }
    return this.transporter;
  }

  async sendEmail(payload: EmailPayload): Promise<DeliveryResult> {
    try {
      validateEmailPayload(payload);
      const transporter = await this.getTransporter();

      const info = await transporter.sendMail({
        from: `"${this.senderName}" <${this.senderEmail}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.body,
        text: this.htmlToText(payload.body),
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Nodemailer send failed: ${error.message}`);
      return {
        success: false,
        error: `SMTP delivery failed: ${error.message}`,
      };
    }
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

/**
 * Logger Email Provider (Development/Testing)
 * Logs to console instead of sending
 */
export class LoggerEmailProvider implements EmailDriver {
  private readonly logger = new Logger(LoggerEmailProvider.name);

  async sendEmail(payload: EmailPayload): Promise<DeliveryResult> {
    this.logger.log(
      `[LoggerEmailProvider] Email to ${maskEmail(payload.to)} | Subject: ${payload.subject} | Body length: ${payload.body.length}`,
    );
    return { success: true, messageId: `logger-email-${randomUUID()}` };
  }
}

/**
 * Email Service - Main entry point for sending emails
 * Supports configurable providers with audit logging and HTML templates
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly driver: EmailDriver;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {
    this.driver = this.createDriver();
  }

  private createDriver(): EmailDriver {
    const provider = (
      this.config.get<string>('EMAIL_PROVIDER') || 'logger'
    ).toLowerCase();

    switch (provider) {
      case 'ses': {
        const region =
          this.config.get<string>('AWS_SES_REGION') ||
          this.config.get<string>('AWS_REGION');
        const senderEmail =
          this.config.get<string>('SES_SENDER_EMAIL') ||
          this.config.get<string>('EMAIL_FROM');
        const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.config.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        );
        const sessionToken = this.config.get<string>('AWS_SESSION_TOKEN');

        if (!region || !senderEmail || !accessKeyId || !secretAccessKey) {
          throw new InternalServerErrorException(
            'AWS SES provider requires AWS_SES_REGION (or AWS_REGION), SES_SENDER_EMAIL (or EMAIL_FROM), AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY',
          );
        }
        return new SesEmailProvider(
          region,
          senderEmail,
          accessKeyId,
          secretAccessKey,
          sessionToken,
        );
      }

      case 'sendgrid': {
        const apiKey = this.config.get<string>('SENDGRID_API_KEY');
        const senderEmail =
          this.config.get<string>('SENDGRID_SENDER_EMAIL') ||
          this.config.get<string>('EMAIL_FROM');
        const senderName =
          this.config.get<string>('SENDGRID_SENDER_NAME') ||
          'HMS Notifications';

        if (!apiKey || !senderEmail) {
          throw new InternalServerErrorException(
            'SendGrid provider requires SENDGRID_API_KEY and SENDGRID_SENDER_EMAIL (or EMAIL_FROM)',
          );
        }
        return new SendGridEmailProvider(apiKey, senderEmail, senderName);
      }

      case 'smtp':
      case 'nodemailer': {
        const host = this.config.get<string>('SMTP_HOST');
        const port = parseInt(
          this.config.get<string>('SMTP_PORT') || '587',
          10,
        );
        const username = this.config.get<string>('SMTP_USER');
        const password = this.config.get<string>('SMTP_PASS');
        const senderEmail =
          this.config.get<string>('SMTP_SENDER_EMAIL') ||
          this.config.get<string>('EMAIL_FROM');
        const senderName =
          this.config.get<string>('SMTP_SENDER_NAME') || 'HMS Notifications';
        const secure = this.config.get<string>('SMTP_SECURE') === 'true';

        if (!host || !username || !password || !senderEmail) {
          throw new InternalServerErrorException(
            'SMTP provider requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_SENDER_EMAIL (or EMAIL_FROM)',
          );
        }
        return new NodemailerEmailProvider(
          host,
          port,
          username,
          password,
          senderEmail,
          senderName,
          secure,
        );
      }

      case 'logger':
      default: {
        if (this.config.get<string>('NODE_ENV') === 'production') {
          throw new InternalServerErrorException(
            'EMAIL_PROVIDER=logger is not allowed in production. Use "ses", "sendgrid", or "smtp".',
          );
        }
        return new LoggerEmailProvider();
      }
    }
  }

  /**
   * Send an email with audit logging
   */
  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    tenantId: string,
    userId?: string,
    context?: { ipAddress?: string; userAgent?: string },
  ): Promise<DeliveryResult> {
    // Validate email payload
    try {
      validateEmail({ to, subject, body: htmlContent });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Invalid email payload';
      this.logger.warn(`Email validation failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }

    this.logger.log(
      `Sending email to ${maskEmail(to)} via ${this.driver.constructor.name}`,
    );

    const payload: EmailPayload = {
      to,
      subject,
      body: htmlContent,
    };

    const result = await this.driver.sendEmail(payload);

    // Audit logging
    try {
      await this.audit.logSystemEvent({
        tenantId,
        eventKey: result.success
          ? AUDIT_EVENT_KEYS.EMAIL_SENT
          : AUDIT_EVENT_KEYS.EMAIL_FAILED,
        recordType: 'Notification',
        recordId: result.messageId || `email-${Date.now()}`,
        newValues: {
          to: maskEmail(to),
          subject,
          bodyLength: htmlContent.length,
          provider: this.driver.constructor.name,
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        },
      });
    } catch (auditError) {
      this.logger.warn(
        `Failed to log email audit event: ${auditError.message}`,
      );
    }

    return result;
  }

  /**
   * Send appointment confirmation email with HTML template
   */
  async sendAppointmentConfirmation(
    tenantId: string,
    patientEmail: string,
    patientName: string,
    appointmentDate: string,
    appointmentTime: string,
    clinicName: string,
    doctorName: string,
    portalUrl: string,
    userId?: string,
  ): Promise<DeliveryResult> {
    const htmlContent = this.renderAppointmentConfirmation({
      patientName,
      appointmentDate,
      appointmentTime,
      clinicName,
      doctorName,
      portalUrl,
    });

    return this.sendEmail(
      patientEmail,
      `Appointment Confirmed - ${clinicName}`,
      htmlContent,
      tenantId,
      userId,
    );
  }

  /**
   * Send lab result ready notification email (PHI-safe)
   */
  async sendLabResultReady(
    tenantId: string,
    patientEmail: string,
    patientName: string,
    portalUrl: string,
    hospitalName: string,
    userId?: string,
  ): Promise<DeliveryResult> {
    const htmlContent = this.renderLabResultReady({
      patientName,
      portalUrl,
      hospitalName,
    });

    return this.sendEmail(
      patientEmail,
      'Your Lab Results Are Ready',
      htmlContent,
      tenantId,
      userId,
    );
  }

  /**
   * Send invoice/payment receipt email
   */
  async sendInvoiceReceipt(
    tenantId: string,
    patientEmail: string,
    patientName: string,
    amount: string,
    receiptNumber: string,
    invoiceDate: string,
    portalUrl: string,
    userId?: string,
  ): Promise<DeliveryResult> {
    const htmlContent = this.renderInvoiceReceipt({
      patientName,
      amount,
      receiptNumber,
      invoiceDate,
      portalUrl,
    });

    return this.sendEmail(
      patientEmail,
      `Payment Receipt - ${receiptNumber}`,
      htmlContent,
      tenantId,
      userId,
    );
  }

  /**
   * Render appointment confirmation HTML email
   */
  private renderAppointmentConfirmation(data: {
    patientName: string;
    appointmentDate: string;
    appointmentTime: string;
    clinicName: string;
    doctorName: string;
    portalUrl: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Appointment Confirmed</h1>
  </div>
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px; margin-top: 0;">Dear <strong>${this.escapeHtml(data.patientName)}</strong>,</p>
    
    <p>Your appointment has been confirmed. Here are the details:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; font-weight: 600; width: 30%;">Clinic</td>
        <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">${this.escapeHtml(data.clinicName)}</td>
      </tr>
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Doctor</td>
        <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">${this.escapeHtml(data.doctorName)}</td>
      </tr>
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Date</td>
        <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">${this.escapeHtml(data.appointmentDate)}</td>
      </tr>
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Time</td>
        <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">${this.escapeHtml(data.appointmentTime)}</td>
      </tr>
    </table>
    
    <p style="margin-top: 25px;">Please arrive 15 minutes before your scheduled time. You can view and manage your appointments in the patient portal.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${this.escapeHtml(data.portalUrl)}" style="background: #2563eb; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">View in Patient Portal</a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    
    <p style="font-size: 14px; color: #64748b; margin: 0;">
      If you need to reschedule or cancel, please contact ${this.escapeHtml(data.clinicName)} directly.
    </p>
  </div>
  <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
    <p>This is an automated message from ${this.escapeHtml(data.clinicName)}. Please do not reply to this email.</p>
  </div>
</body>
</html>
`;
  }

  /**
   * Render lab result ready HTML email (PHI-safe - no result values)
   */
  private renderLabResultReady(data: {
    patientName: string;
    portalUrl: string;
    hospitalName: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lab Results Ready</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Lab Results Available</h1>
  </div>
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px; margin-top: 0;">Dear <strong>${this.escapeHtml(data.patientName)}</strong>,</p>
    
    <p>Your lab results are now available for secure viewing. For your privacy and security, <strong>result values are not included in this email</strong>.</p>
    
    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;"><strong>⚠ Privacy Notice:</strong> Lab results contain protected health information. Please access them only through the secure patient portal.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${this.escapeHtml(data.portalUrl)}" style="background: #059669; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">View Results Securely</a>
    </div>
    
    <p style="margin-top: 25px;">If you have questions about your results, please contact your healthcare provider at ${this.escapeHtml(data.hospitalName)}.</p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    
    <p style="font-size: 14px; color: #64748b; margin: 0;">
      This is an automated notification from ${this.escapeHtml(data.hospitalName)}. For security, this email does not contain any medical information.
    </p>
  </div>
  <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
    <p>Please do not reply to this email. Contact ${this.escapeHtml(data.hospitalName)} for assistance.</p>
  </div>
</body>
</html>
`;
  }

  /**
   * Render invoice/payment receipt HTML email
   */
  private renderInvoiceReceipt(data: {
    patientName: string;
    amount: string;
    receiptNumber: string;
    invoiceDate: string;
    portalUrl: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Payment Received</h1>
  </div>
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px; margin-top: 0;">Dear <strong>${this.escapeHtml(data.patientName)}</strong>,</p>
    
    <p>Thank you for your payment. Your transaction has been processed successfully.</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; font-weight: 600; width: 40%;">Receipt Number</td>
        <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">${this.escapeHtml(data.receiptNumber)}</td>
      </tr>
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Date</td>
        <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">${this.escapeHtml(data.invoiceDate)}</td>
      </tr>
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Amount Paid</td>
        <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; font-size: 18px; font-weight: 700; color: #059669;">${this.escapeHtml(data.amount)}</td>
      </tr>
    </table>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${this.escapeHtml(data.portalUrl)}" style="background: #7c3aed; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">View Full Statement</a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    
    <p style="font-size: 14px; color: #64748b; margin: 0;">
      Keep this receipt for your records. For detailed billing history, visit the patient portal.
    </p>
  </div>
  <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
    <p>This is an automated receipt. Please do not reply to this email.</p>
  </div>
</body>
</html>
`;
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#039;');
  }
}

/**
 * Validate email payload
 */
function validateEmail(payload: EmailPayload): void {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.to)) {
    throw new Error('Recipient email address is invalid.');
  }
  if (/\r|\n/.test(payload.to)) {
    throw new Error('Recipient contains prohibited newline characters.');
  }
  if (/\r|\n/.test(payload.subject)) {
    throw new Error('Subject contains prohibited newline characters.');
  }
  if (!payload.body?.trim()) {
    throw new Error('Email body cannot be empty.');
  }
}

/**
 * Mask email for logging
 */
export function maskEmail(email: string): string {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return 'invalid-email';
  const mailbox = parts[0];
  const domain = parts[1];
  if (mailbox.length <= 2) {
    return `${mailbox}*****@${domain}`;
  }
  return `${mailbox.substring(0, 2)}*****@${domain}`;
}
