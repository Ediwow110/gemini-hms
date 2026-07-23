import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  const prisma = {
    session: { count: jest.fn() },
    integration: { count: jest.fn() },
    backupRecord: { count: jest.fn() },
    auditLog: { count: jest.fn() },
  };

  let service: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnalyticsService(prisma as never);
  });

  it('counts only non-expired sessions as active', async () => {
    prisma.session.count.mockResolvedValue(7);
    prisma.integration.count.mockResolvedValue(4);
    prisma.backupRecord.count.mockResolvedValue(1);

    const before = Date.now();
    const result = await service.getItMetrics('tenant-1');
    const after = Date.now();

    expect(result).toEqual({
      activeSessions: 7,
      healthyIntegrations: 4,
      backupFailures: 1,
      systemLatencyMs: 0,
    });
    expect(prisma.session.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        expiresAt: { gt: expect.any(Date) },
      },
    });

    const cutoff = prisma.session.count.mock.calls[0][0].where.expiresAt
      .gt as Date;
    expect(cutoff.getTime()).toBeGreaterThanOrEqual(before);
    expect(cutoff.getTime()).toBeLessThanOrEqual(after);
  });

  it('clamps the derived compliance score at zero', async () => {
    prisma.auditLog.count.mockResolvedValueOnce(500).mockResolvedValueOnce(30);

    await expect(service.getComplianceMetrics('tenant-1')).resolves.toEqual({
      totalAuditEvents: 500,
      securityAlerts: 30,
      complianceScore: 0,
    });
  });

  it('returns a full compliance score when no breach event exists', async () => {
    prisma.auditLog.count.mockResolvedValueOnce(200).mockResolvedValueOnce(0);

    await expect(service.getComplianceMetrics('tenant-1')).resolves.toEqual({
      totalAuditEvents: 200,
      securityAlerts: 0,
      complianceScore: 100,
    });
  });
});
