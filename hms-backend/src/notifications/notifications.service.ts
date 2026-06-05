import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  renderTemplate,
  NotificationTemplateData,
} from './notification-templates';
import { MAX_PAGE_SIZE } from '../common/utils/pagination';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createNotification(data: {
    tenantId: string;
    userId?: string;
    patientId?: string;
    type: string;
    recipient: string;
    subject?: string;
    content: string;
    templateKey?: string;
    category?: string;
    priority?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        patientId: data.patientId,
        type: data.type,
        recipient: data.recipient,
        subject: data.subject,
        content: data.content,
        templateKey: data.templateKey,
        category: data.category || 'SYSTEM',
        priority: data.priority || 'NORMAL',
        status: 'PENDING',
        attempts: 0,
      },
    });
  }

  async listNotifications(
    tenantId: string,
    userId: string,
    filters?: {
      status?: string;
      category?: string;
      priority?: string;
      type?: string;
      search?: string;
    },
  ) {
    const where: Record<string, any> = {
      tenantId,
      OR: [{ userId: null }, { userId: userId }],
    };

    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.type) where.type = filters.type;
    if (filters?.search) {
      where.AND = [
        {
          OR: [
            { subject: { contains: filters.search, mode: 'insensitive' } },
            { content: { contains: filters.search, mode: 'insensitive' } },
            { recipient: { contains: filters.search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: MAX_PAGE_SIZE,
    });
  }

  async markAsRead(id: string, tenantId: string, viewerUserId: string) {
    const updateResult = await this.prisma.notification.updateMany({
      where: {
        id,
        tenantId,
        OR: [{ userId: null }, { userId: viewerUserId }],
      },
      data: { status: 'READ', readAt: new Date() },
    });

    if (updateResult.count === 0) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.findFirst({
      where: { id, tenantId },
    });
  }

  async markAllAsRead(tenantId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        tenantId,
        status: { in: ['PENDING', 'SENT'] },
        OR: [{ userId: null }, { userId: userId }],
      },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  async getStats(tenantId: string, userId: string) {
    const userScope = {
      OR: [{ userId: null }, { userId: userId }],
    };

    const [unread, critical, failed, pending] = await Promise.all([
      this.prisma.notification.count({
        where: {
          tenantId,
          ...userScope,
          status: { in: ['PENDING', 'SENT'] },
        },
      }),
      this.prisma.notification.count({
        where: {
          tenantId,
          ...userScope,
          priority: 'CRITICAL',
          status: { not: 'READ' },
        },
      }),
      this.prisma.notification.count({
        where: { tenantId, ...userScope, status: 'FAILED' },
      }),
      this.prisma.notification.count({
        where: { tenantId, ...userScope, status: 'PENDING' },
      }),
    ]);
    return { unread, critical, failed, pending };
  }

  // --- Factory methods for common notification types ---

  async createLowStockAlert(tenantId: string, data: NotificationTemplateData) {
    const { subject, body } = renderTemplate('LOW_STOCK_ALERT', data);
    return this.createNotification({
      tenantId,
      type: 'IN_APP',
      recipient: 'ROLE:Pharmacist',
      subject,
      content: body,
      templateKey: 'LOW_STOCK_ALERT',
      category: 'ALERT',
      priority: 'HIGH',
    });
  }

  async createResultReadyNotice(
    tenantId: string,
    patientId: string,
    data: NotificationTemplateData,
  ) {
    const { subject, body } = renderTemplate('RESULT_READY', data);
    return this.createNotification({
      tenantId,
      patientId,
      type: 'IN_APP',
      recipient: patientId,
      subject,
      content: body,
      templateKey: 'RESULT_READY',
      category: 'RESULT',
      priority: 'HIGH',
    });
  }

  async createApprovalRequestNotice(
    tenantId: string,
    userId: string,
    data: NotificationTemplateData,
  ) {
    const { subject, body } = renderTemplate('APPROVAL_REQUEST', data);
    return this.createNotification({
      tenantId,
      userId,
      type: 'IN_APP',
      recipient: userId,
      subject,
      content: body,
      templateKey: 'APPROVAL_REQUEST',
      category: 'APPROVAL',
      priority: 'HIGH',
    });
  }

  async createPaymentConfirmationNotice(
    tenantId: string,
    patientId: string,
    data: NotificationTemplateData,
  ) {
    const { subject, body } = renderTemplate('PAYMENT_CONFIRMATION', data);
    return this.createNotification({
      tenantId,
      patientId,
      type: 'IN_APP',
      recipient: patientId,
      subject,
      content: body,
      templateKey: 'PAYMENT_CONFIRMATION',
      category: 'PAYMENT',
      priority: 'NORMAL',
    });
  }

  static maskEmail(email: string): string {
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

  static maskPhone(phone: string): string {
    if (!phone) return '';
    if (phone.length <= 5) return phone;
    const prefix = phone.substring(0, 3);
    const suffix = phone.substring(phone.length - 2);
    return `${prefix}*****${suffix}`;
  }
}
