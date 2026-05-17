import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SlaAlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async checkSlaThresholds(tenantId: string) {
    const waitTimeData = await this.analyticsService.getWaitTime(tenantId);
    const threshold = 15.0; // 15 minutes threshold for REGULAR patients
    const actual = waitTimeData.averageWaitTimeMinutes;

    if (actual > threshold) {
      const alert = await this.prisma.slaAlert.create({
        data: {
          tenantId,
          metricName: 'WAIT_TIME',
          thresholdValue: threshold,
          actualValue: actual,
          status: 'TRIGGERED',
        },
      });

      // Dispatch high-priority notification alert
      await this.notificationsService.createNotification({
        tenantId,
        type: 'SMS',
        recipient: '+15550199',
        subject: 'SLA ALERT: Wait Time Threshold Exceeded',
        content: `High Priority SLA Alert: Average patient wait time is ${actual} minutes, exceeding the ${threshold} minutes SLA threshold.`,
        category: 'SYSTEM',
        priority: 'HIGH',
      });

      return alert;
    }

    return null;
  }

  async getActiveAlerts(tenantId: string) {
    return this.prisma.slaAlert.findMany({
      where: {
        tenantId,
        status: 'TRIGGERED',
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acknowledgeAlert(id: string, tenantId: string) {
    const alert = await this.prisma.slaAlert.findUnique({
      where: { id },
    });

    if (!alert || alert.tenantId !== tenantId) {
      throw new NotFoundException('SLA Alert not found');
    }

    return this.prisma.slaAlert.update({
      where: { id },
      data: {
        status: 'ACKNOWLEDGED',
      },
    });
  }
}
