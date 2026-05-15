import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('NotificationsService Privacy Audit', () => {
  let service: NotificationsService;
  let prisma: any;

  const mockTenantId = 'tenant-1';
  const userA = 'user-a';

  beforeEach(async () => {
    prisma = {
      notification: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: {} },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('listNotifications should only return notifications for the specific user (FIXED)', async () => {
    // Now implementation: filters by tenantId AND userId (or null)
    await service.listNotifications(mockTenantId, userA);

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: mockTenantId,
          OR: [{ userId: null }, { userId: userA }],
        }),
      }),
    );
  });

  it('markAllAsRead should only affect the current user (FIXED)', async () => {
    // Now implementation: filters by tenantId AND userId (or null)
    await service.markAllAsRead(mockTenantId, userA);

    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: mockTenantId,
          OR: [{ userId: null }, { userId: userA }],
        }),
      }),
    );
  });
});
