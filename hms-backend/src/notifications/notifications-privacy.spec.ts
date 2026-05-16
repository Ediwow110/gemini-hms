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

  describe('Privacy Shield (The Golden Rule)', () => {
    it('should reject notifications containing diagnosis', async () => {
      await expect(
        service.createNotification({
          tenantId: mockTenantId,
          type: 'EMAIL',
          recipient: 'patient@example.com',
          content: 'Your diagnosis is flu',
          // @ts-expect-error - testing runtime shield
          diagnosis: 'flu',
        }),
      ).rejects.toThrow(/Privacy Shield violation/);
    });

    it('should reject notifications containing lab_result_value', async () => {
      await expect(
        service.createNotification({
          tenantId: mockTenantId,
          type: 'EMAIL',
          recipient: 'patient@example.com',
          content: 'Your result is 5.0',
          // @ts-expect-error - testing runtime shield
          lab_result_value: '5.0',
        }),
      ).rejects.toThrow(/Privacy Shield violation/);
    });

    it('should reject external notifications with PHI in templateData', async () => {
      await expect(
        service.sendExternalNotification({
          tenantId: mockTenantId,
          branchId: 'branch-1',
          patientId: 'patient-1',
          channel: 'EMAIL',
          recipient: 'patient@example.com',
          templateName: 'RESULT_READY',
          templateData: {
            patientName: 'John',
            diagnosis: 'Malaria',
          },
        }),
      ).rejects.toThrow(/Privacy Shield violation/);
    });

    it('should allow notifications with safe keys', async () => {
      prisma.notificationLog = {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      };

      const result = await service.sendExternalNotification({
        tenantId: mockTenantId,
        branchId: 'branch-1',
        patientId: 'patient-1',
        channel: 'EMAIL',
        recipient: 'patient@example.com',
        templateName: 'RESULT_READY',
        templateData: {
          patientName: 'John',
          secureLink: 'https://portal.hms.ph/results/123',
        },
      });

      expect(result.id).toBe('log-1');
    });
  });
});
