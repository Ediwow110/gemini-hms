import { InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as tls from 'tls';

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export interface SmsPayload {
  to: string;
  body: string;
}

export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  sendEmail(payload: EmailPayload): Promise<DeliveryResult>;
}

export interface SmsProvider {
  sendSms(payload: SmsPayload): Promise<DeliveryResult>;
}

export function maskEmail(email: string): string {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return 'invalid-email';
  const mailbox = parts[0];
  const domain = parts[1];
  return `${mailbox.substring(0, Math.min(2, mailbox.length))}*****@${domain}`;
}

export function maskPhone(phone: string): string {
  if (!phone) return '';
  if (phone.length <= 5) return '*****';
  return `${phone.substring(0, 3)}*****${phone.substring(phone.length - 2)}`;
}

export class MockEmailProvider implements EmailProvider {
  async sendEmail(payload: EmailPayload): Promise<DeliveryResult> {
    console.log(
      `[MockEmailProvider] Sending email to ${maskEmail(payload.to)}: ${payload.subject}`,
    );
    return { success: true, messageId: `mock-email-${crypto.randomUUID()}` };
  }
}

export class MockSmsProvider implements SmsProvider {
  async sendSms(payload: SmsPayload): Promise<DeliveryResult> {
    console.log(
      `[MockSmsProvider] Sending SMS to ${maskPhone(payload.to)} (${payload.body.length} characters)`,
    );
    return { success: true, messageId: `mock-sms-${crypto.randomUUID()}` };
  }
}

export class FailingMockEmailProvider implements EmailProvider {
  async sendEmail(_payload: EmailPayload): Promise<DeliveryResult> {
    return { success: false, error: 'SMTP connection refused (mock failure)' };
  }
}

export class MailrelayProvider implements EmailProvider {
  private readonly host: string;
  private readonly port: number;
  private readonly username: string;
  private readonly password: string;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor() {
    this.host = requireEnvironment('MAILRELAY_SMTP_HOST');
    this.port = parsePort(process.env.MAILRELAY_SMTP_PORT ?? '465');
    this.username = requireEnvironment('MAILRELAY_SMTP_USER');
    this.password = requireEnvironment('MAILRELAY_SMTP_PASS');
    this.senderEmail = requireEnvironment('MAILRELAY_SENDER_EMAIL');
    this.senderName = requireEnvironment('MAILRELAY_SENDER_NAME');
  }

  async sendEmail(payload: EmailPayload): Promise<DeliveryResult> {
    try {
      validateEmailPayload(payload);
      const messageId = await sendTlsSmtpMessage(
        {
          host: this.host,
          port: this.port,
          username: this.username,
          password: this.password,
          senderEmail: this.senderEmail,
          senderName: this.senderName,
        },
        payload,
      );
      return { success: true, messageId };
    } catch (error) {
      return {
        success: false,
        error: safeDeliveryError(error, 'SMTP delivery failed'),
      };
    }
  }
}

export class SesProvider implements EmailProvider {
  private readonly region: string;
  private readonly senderEmail: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly sessionToken?: string;

  constructor() {
    this.region = requireEnvironment('AWS_REGION');
    this.senderEmail = requireEnvironment('SES_SENDER_EMAIL');
    this.accessKeyId = requireEnvironment('AWS_ACCESS_KEY_ID');
    this.secretAccessKey = requireEnvironment('AWS_SECRET_ACCESS_KEY');
    this.sessionToken = process.env.AWS_SESSION_TOKEN?.trim() || undefined;
  }

  async sendEmail(payload: EmailPayload): Promise<DeliveryResult> {
    try {
      validateEmailPayload(payload);
      const messageId = await sendSesEmail(
        {
          region: this.region,
          senderEmail: this.senderEmail,
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
          sessionToken: this.sessionToken,
        },
        payload,
      );
      return { success: true, messageId };
    } catch (error) {
      return {
        success: false,
        error: safeDeliveryError(error, 'SES delivery failed'),
      };
    }
  }
}

export class SemaphoreProvider implements SmsProvider {
  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly senderName?: string;

  constructor() {
    this.apiKey = requireEnvironment('SEMAPHORE_API_KEY');
    this.endpoint =
      process.env.SEMAPHORE_API_URL?.trim() ||
      'https://api.semaphore.co/api/v4/messages';
    this.senderName = process.env.SEMAPHORE_SENDER_NAME?.trim() || undefined;

    const parsedEndpoint = new URL(this.endpoint);
    if (parsedEndpoint.protocol !== 'https:') {
      throw new InternalServerErrorException(
        'SEMAPHORE_API_URL must use HTTPS.',
      );
    }
  }

  async sendSms(payload: SmsPayload): Promise<DeliveryResult> {
    try {
      validateSmsPayload(payload);
      const form = new URLSearchParams({
        apikey: this.apiKey,
        number: payload.to,
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
        throw new Error(`Semaphore returned HTTP ${response.status}.`);
      }

      const result = (await response.json()) as unknown;
      const first = Array.isArray(result) ? result[0] : result;
      const messageId = extractString(first, ['message_id', 'messageId']);
      if (!messageId) {
        throw new Error('Semaphore response did not include a message ID.');
      }
      return { success: true, messageId };
    } catch (error) {
      return {
        success: false,
        error: safeDeliveryError(error, 'SMS delivery failed'),
      };
    }
  }
}

export class NotificationProviderFactory {
  static createEmailProvider(): EmailProvider {
    const provider = (process.env.EMAIL_PROVIDER || 'mock').toLowerCase();

    if (provider === 'mailrelay') return new MailrelayProvider();
    if (provider === 'ses') return new SesProvider();
    if (provider === 'mock') {
      assertMockProviderAllowed('EMAIL_PROVIDER');
      return new MockEmailProvider();
    }

    throw new InternalServerErrorException(
      `Invalid EMAIL_PROVIDER configured: ${provider}`,
    );
  }

  static createSmsProvider(): SmsProvider {
    const provider = (process.env.SMS_PROVIDER || 'mock').toLowerCase();

    if (provider === 'semaphore') return new SemaphoreProvider();
    if (provider === 'mock') {
      assertMockProviderAllowed('SMS_PROVIDER');
      return new MockSmsProvider();
    }

    throw new InternalServerErrorException(
      `Invalid SMS_PROVIDER configured: ${provider}`,
    );
  }
}

interface SmtpConfiguration {
  host: string;
  port: number;
  username: string;
  password: string;
  senderEmail: string;
  senderName: string;
}

async function sendTlsSmtpMessage(
  config: SmtpConfiguration,
  payload: EmailPayload,
): Promise<string> {
  const socket = tls.connect({
    host: config.host,
    port: config.port,
    servername: config.host,
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2',
  });
  socket.setTimeout(10_000, () => socket.destroy(new Error('SMTP timeout.')));

  const iterator = socket[Symbol.asyncIterator]();
  let responseBuffer = '';

  const nextLine = async (): Promise<string> => {
    while (!responseBuffer.includes('\r\n')) {
      const chunk = await iterator.next();
      if (chunk.done) throw new Error('SMTP connection closed unexpectedly.');
      responseBuffer += Buffer.from(chunk.value).toString('utf8');
    }
    const lineEnd = responseBuffer.indexOf('\r\n');
    const line = responseBuffer.slice(0, lineEnd);
    responseBuffer = responseBuffer.slice(lineEnd + 2);
    return line;
  };

  const readResponse = async (expectedCodes: number[]): Promise<string[]> => {
    const lines: string[] = [];
    let code: number | undefined;
    while (true) {
      const line = await nextLine();
      lines.push(line);
      const match = /^(\d{3})([ -])/.exec(line);
      if (!match) continue;
      code ??= Number(match[1]);
      if (Number(match[1]) === code && match[2] === ' ') {
        if (!expectedCodes.includes(code)) {
          throw new Error(
            `SMTP server rejected the request with code ${code}.`,
          );
        }
        return lines;
      }
    }
  };

  const command = async (value: string, expectedCodes: number[]) => {
    socket.write(`${value}\r\n`);
    return readResponse(expectedCodes);
  };

  try {
    await new Promise<void>((resolve, reject) => {
      socket.once('secureConnect', resolve);
      socket.once('error', reject);
    });
    await readResponse([220]);
    await command(`EHLO ${safeEhloName()}`, [250]);
    const auth = Buffer.from(
      `\u0000${config.username}\u0000${config.password}`,
    ).toString('base64');
    await command(`AUTH PLAIN ${auth}`, [235]);
    await command(`MAIL FROM:<${config.senderEmail}>`, [250]);
    await command(`RCPT TO:<${payload.to}>`, [250, 251]);
    await command('DATA', [354]);

    const messageId = `<${crypto.randomUUID()}@${safeEhloName()}>`;
    const headers = [
      `From: ${encodeHeader(config.senderName)} <${config.senderEmail}>`,
      `To: <${payload.to}>`,
      `Subject: ${encodeHeader(payload.subject)}`,
      `Message-ID: ${messageId}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
    ].join('\r\n');
    const body = normalizeCrlf(payload.body)
      .split('\r\n')
      .map((line) => (line.startsWith('.') ? `.${line}` : line))
      .join('\r\n');
    socket.write(`${headers}${body}\r\n.\r\n`);
    await readResponse([250]);
    await command('QUIT', [221]);
    return messageId;
  } finally {
    socket.destroy();
  }
}

interface SesConfiguration {
  region: string;
  senderEmail: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

async function sendSesEmail(
  config: SesConfiguration,
  payload: EmailPayload,
): Promise<string> {
  const service = 'ses';
  const host = `email.${config.region}.amazonaws.com`;
  const path = '/v2/email/outbound-emails';
  const endpoint = `https://${host}${path}`;
  const body = JSON.stringify({
    FromEmailAddress: config.senderEmail,
    Destination: { ToAddresses: [payload.to] },
    Content: {
      Simple: {
        Subject: { Data: payload.subject, Charset: 'UTF-8' },
        Body: { Text: { Data: payload.body, Charset: 'UTF-8' } },
      },
    },
  });
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(body);

  const canonicalHeaderEntries: Array<[string, string]> = [
    ['content-type', 'application/json'],
    ['host', host],
    ['x-amz-content-sha256', payloadHash],
    ['x-amz-date', amzDate],
  ];
  if (config.sessionToken) {
    canonicalHeaderEntries.push(['x-amz-security-token', config.sessionToken]);
  }
  canonicalHeaderEntries.sort(([a], [b]) => a.localeCompare(b));

  const canonicalHeaders = canonicalHeaderEntries
    .map(([key, value]) => `${key}:${value.trim()}\n`)
    .join('');
  const signedHeaders = canonicalHeaderEntries.map(([key]) => key).join(';');
  const canonicalRequest = [
    'POST',
    path,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');
  const credentialScope = `${dateStamp}/${config.region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');
  const signingKey = deriveAwsSigningKey(
    config.secretAccessKey,
    dateStamp,
    config.region,
    service,
  );
  const signature = hmacHex(signingKey, stringToSign);
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    authorization,
  };
  if (config.sessionToken) {
    headers['x-amz-security-token'] = config.sessionToken;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body,
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`AWS SES returned HTTP ${response.status}.`);
  }
  const result = (await response.json()) as unknown;
  const messageId = extractString(result, ['MessageId', 'messageId']);
  if (!messageId) {
    throw new Error('AWS SES response did not include a message ID.');
  }
  return messageId;
}

function requireEnvironment(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new InternalServerErrorException(`${key} is required.`);
  }
  return value;
}

function parsePort(value: string): number {
  const port = Number.parseInt(value, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new InternalServerErrorException('MAILRELAY_SMTP_PORT is invalid.');
  }
  return port;
}

function assertMockProviderAllowed(variable: string): void {
  if (
    process.env.NODE_ENV !== 'development' &&
    process.env.NODE_ENV !== 'test'
  ) {
    throw new InternalServerErrorException(
      `${variable}=mock is not allowed in ${process.env.NODE_ENV || 'current'} environment.`,
    );
  }
}

function validateEmailPayload(payload: EmailPayload): void {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.to)) {
    throw new Error('Recipient email address is invalid.');
  }
  rejectHeaderInjection(payload.to, 'Recipient');
  rejectHeaderInjection(payload.subject, 'Subject');
  if (!payload.body.trim()) throw new Error('Email body cannot be empty.');
}

function validateSmsPayload(payload: SmsPayload): void {
  if (!/^\+?[1-9]\d{7,14}$/.test(payload.to.replace(/[\s()-]/g, ''))) {
    throw new Error('Recipient phone number is invalid.');
  }
  if (!payload.body.trim()) throw new Error('SMS body cannot be empty.');
  if (payload.body.length > 1600) throw new Error('SMS body is too long.');
}

function rejectHeaderInjection(value: string, label: string): void {
  if (/\r|\n/.test(value)) {
    throw new Error(`${label} contains prohibited newline characters.`);
  }
}

function encodeHeader(value: string): string {
  rejectHeaderInjection(value, 'Header');
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

function normalizeCrlf(value: string): string {
  return value.replace(/\r?\n/g, '\r\n');
}

function safeEhloName(): string {
  return process.env.SMTP_EHLO_NAME?.trim() || 'hms.local';
}

function safeDeliveryError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : fallback;
  return message.replace(/[\r\n]+/g, ' ').slice(0, 240);
}

function extractString(value: unknown, keys: string[]): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    if (typeof record[key] === 'string' && record[key]) {
      return record[key];
    }
  }
  return undefined;
}

function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function hmac(key: Buffer | string, value: string): Buffer {
  return crypto.createHmac('sha256', key).update(value, 'utf8').digest();
}

function hmacHex(key: Buffer | string, value: string): string {
  return crypto.createHmac('sha256', key).update(value, 'utf8').digest('hex');
}

function deriveAwsSigningKey(
  secret: string,
  date: string,
  region: string,
  service: string,
): Buffer {
  const dateKey = hmac(`AWS4${secret}`, date);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, service);
  return hmac(serviceKey, 'aws4_request');
}
