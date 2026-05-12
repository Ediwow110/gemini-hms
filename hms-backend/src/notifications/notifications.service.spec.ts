// NotificationsService cross-tenant write isolation test
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

describe('NotificationsService write isolation', () => {
  let service: NotificationsService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: {
            notification: {
              findFirst: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  const tenantId = 'tenant-1';
  const otherTenantId = 'tenant-2';
  const notificationId = 'notif-123';

  it('should reject markAsRead when notification belongs to another tenant', async () => {
    prisma.notification.findFirst.mockResolvedValue({
      id: notificationId,
      tenantId: otherTenantId,
    });
    prisma.notification.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.markAsRead(notificationId, tenantId)).rejects.toThrow(
      NotFoundException,
    );

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: notificationId, tenantId },
      data: { status: 'READ', readAt: expect.any(Date) },
    });
  });
});
