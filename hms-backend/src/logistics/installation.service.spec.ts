import { AssetInstallStatus, InstallStatus } from '@prisma/client';
import { InstallationService } from './installation.service';

describe('InstallationService branch scoping', () => {
  const prisma = {
    installationJob: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    asset: { update: jest.fn() },
    $transaction: jest.fn(),
  };
  const audit = { log: jest.fn() };
  let service: InstallationService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback(prisma),
    );
    service = new InstallationService(prisma as any, audit as any);
  });

  it('filters installation jobs through the selected RFQ branch', async () => {
    prisma.installationJob.findMany.mockResolvedValue([]);

    await service.findAll('tenant-1', 'branch-1');

    expect(prisma.installationJob.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-1',
          asset: {
            salesOrder: { quote: { rfq: { branchId: 'branch-1' } } },
          },
        },
      }),
    );
  });

  it('maps COMMISSIONED to the asset commissioned state and branch audit context', async () => {
    const job = {
      id: 'job-1',
      tenantId: 'tenant-1',
      assetId: 'asset-1',
      status: InstallStatus.IN_PROGRESS,
      notes: null,
      commissionedAt: null,
      handoverSignedAt: null,
      asset: {
        id: 'asset-1',
        installationStatus: AssetInstallStatus.ASSEMBLING,
        warrantyStart: null,
        warrantyEnd: null,
      },
      assignedUser: { id: 'tech-1', email: 'tech@example.test' },
    };
    prisma.installationJob.findFirst.mockResolvedValue(job);
    prisma.installationJob.update.mockResolvedValue({
      ...job,
      status: InstallStatus.COMMISSIONED,
    });
    prisma.asset.update.mockResolvedValue({});

    const result = await service.updateStatus(
      'tenant-1',
      'branch-1',
      'admin-1',
      'job-1',
      { status: InstallStatus.COMMISSIONED },
    );

    expect(prisma.asset.update).toHaveBeenCalledWith({
      where: { id: 'asset-1', tenantId: 'tenant-1' },
      data: expect.objectContaining({
        installationStatus: AssetInstallStatus.COMMISSIONED,
      }),
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ recordId: 'job-1' }),
      prisma,
      'branch-1',
    );
    expect(result.assetInstallStatus).toBe(AssetInstallStatus.COMMISSIONED);
  });
});
