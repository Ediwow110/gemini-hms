/**
 * Notification template helpers.
 * All templates follow PHI-safe rules:
 * - No lab result values in email/SMS
 * - No diagnosis in email/SMS
 * - No sensitive patient data in public channels
 * - Result-ready text points to secure portal only
 */

export interface NotificationTemplateData {
  patientName?: string;
  hospitalName?: string;
  portalUrl?: string;
  itemName?: string;
  itemSku?: string;
  currentStock?: number;
  reorderLevel?: string;
  approvalType?: string;
  requestId?: string;
  amount?: string;
  receiptNumber?: string;
  userName?: string;
  ipAddress?: string;
  [key: string]: unknown;
}

export const NOTIFICATION_TEMPLATES = {
  ACCOUNT_INVITATION: {
    key: 'ACCOUNT_INVITATION',
    subject: 'You have been invited to {{hospitalName}}',
    body: 'Dear {{userName}},\n\nYou have been invited to join {{hospitalName}} on the HMS platform.\n\nPlease visit {{portalUrl}} to set up your account.\n\nThank you.',
    category: 'SYSTEM',
    priority: 'NORMAL',
    channels: ['EMAIL', 'IN_APP'],
    containsPhi: false,
  },
  PASSWORD_RESET: {
    key: 'PASSWORD_RESET',
    subject: 'Password Reset Request',
    body: 'Dear {{userName}},\n\nA password reset was requested for your account. If this was you, please visit {{portalUrl}} to complete the reset.\n\nIf you did not request this, please contact your administrator immediately.\n\nThank you.',
    category: 'SECURITY',
    priority: 'HIGH',
    channels: ['EMAIL'],
    containsPhi: false,
  },
  APPOINTMENT_REMINDER: {
    key: 'APPOINTMENT_REMINDER',
    subject: 'Appointment Reminder',
    body: 'Dear {{patientName}},\n\nThis is a reminder that you have an upcoming appointment at {{hospitalName}}.\n\nPlease arrive 15 minutes early. For details, check your patient portal at {{portalUrl}}.\n\nThank you.',
    category: 'SYSTEM',
    priority: 'NORMAL',
    channels: ['EMAIL', 'SMS', 'IN_APP'],
    containsPhi: false,
  },
  QUEUE_UPDATE: {
    key: 'QUEUE_UPDATE',
    subject: 'Queue Status Update',
    body: 'Dear {{patientName}},\n\nYour queue status has been updated. Please check the queue display or your patient portal for your current position.\n\nThank you.',
    category: 'SYSTEM',
    priority: 'NORMAL',
    channels: ['SMS', 'IN_APP'],
    containsPhi: false,
  },
  PAYMENT_CONFIRMATION: {
    key: 'PAYMENT_CONFIRMATION',
    subject: 'Payment Confirmation',
    body: 'Dear {{patientName}},\n\nYour payment of {{amount}} has been received. Receipt number: {{receiptNumber}}.\n\nFor a detailed statement, please visit your patient portal at {{portalUrl}}.\n\nThank you.',
    category: 'PAYMENT',
    priority: 'NORMAL',
    channels: ['EMAIL', 'SMS', 'IN_APP'],
    containsPhi: false,
  },
  RESULT_READY: {
    key: 'RESULT_READY',
    subject: 'A Secure Document Is Available',
    body: 'Dear {{patientName}},\n\nA secure document is available in your patient portal. Please visit {{portalUrl}} to view it.\n\nFor your privacy and security, document details are not included in this message.\n\nThank you,\n{{hospitalName}}',
    category: 'RESULT',
    priority: 'HIGH',
    channels: ['EMAIL', 'SMS', 'IN_APP'],
    containsPhi: false,
  },
  APPROVAL_REQUEST: {
    key: 'APPROVAL_REQUEST',
    subject: 'Approval Required: {{approvalType}}',
    body: 'An action requires your approval.\n\nType: {{approvalType}}\nRequest ID: {{requestId}}\n\nPlease review and take action in the HMS platform.',
    category: 'APPROVAL',
    priority: 'HIGH',
    channels: ['EMAIL', 'IN_APP'],
    containsPhi: false,
  },
  LOW_STOCK_ALERT: {
    key: 'LOW_STOCK_ALERT',
    subject: 'LOW STOCK ALERT: {{itemName}}',
    body: 'Item {{itemName}} (SKU: {{itemSku}}) has fallen to {{currentStock}} units.\nReorder level: {{reorderLevel}}.\n\nPlease initiate a purchase order.',
    category: 'ALERT',
    priority: 'HIGH',
    channels: ['IN_APP', 'EMAIL'],
    containsPhi: false,
  },
  SECURITY_ALERT: {
    key: 'SECURITY_ALERT',
    subject: 'Security Alert: Unusual Activity Detected',
    body: 'Dear {{userName}},\n\nUnusual activity was detected on your account from IP: {{ipAddress}}.\n\nIf this was not you, please change your password immediately and contact your administrator.\n\nThank you.',
    category: 'SECURITY',
    priority: 'CRITICAL',
    channels: ['EMAIL', 'IN_APP'],
    containsPhi: false,
  },
} as const;

export type TemplateKey = keyof typeof NOTIFICATION_TEMPLATES;

export function renderTemplate(
  templateKey: TemplateKey,
  data: NotificationTemplateData,
): { subject: string; body: string } {
  const template = NOTIFICATION_TEMPLATES[templateKey];
  let subject: string = template.subject;
  let body: string = template.body;

  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    const replacement = value == null ? '' : `${value as string | number}`;
    subject = subject.replace(
      new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
      replacement,
    );
    body = body.replace(
      new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
      replacement,
    );
  }

  return { subject, body };
}
