import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  renderTemplate,
  NotificationTemplateData,
} from './notification-templates';

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
    filters?: {
      status?: string;
      category?: string;
      priority?: string;
      type?: string;
      search?: string;
    },
  ) {
    const where: Record<string, unknown> = { tenantId };

    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.type) where.type = filters.type;
    if (filters?.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
        { recipient: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
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

  async markAllAsRead(tenantId: string) {
    return this.prisma.notification.updateMany({
      where: { tenantId, status: { in: ['PENDING', 'SENT'] } },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  async getStats(tenantId: string) {
    const [unread, critical, failed, pending] = await Promise.all([
      this.prisma.notification.count({
        where: { tenantId, status: { in: ['PENDING', 'SENT'] } },
      }),
      this.prisma.notification.count({
        where: { tenantId, priority: 'CRITICAL', status: { not: 'READ' } },
      }),
      this.prisma.notification.count({ where: { tenantId, status: 'FAILED' } }),
      this.prisma.notification.count({
        where: { tenantId, status: 'PENDING' },
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
}
