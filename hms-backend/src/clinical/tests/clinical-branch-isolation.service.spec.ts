import { NotFoundException } from '@nestjs/common';
import { ClinicalNoteService } from '../clinical-note.service';
import { PrescriptionService } from '../prescription.service';
import { ReferralService } from '../referral.service';
import { DiagnosisService } from '../diagnosis.service';

describe('Clinical service branch isolation', () => {
  const tenantId = 'tenant-1';
  const branchId = 'branch-1';
  const otherBranchId = 'branch-2';
  const userId = 'doctor-1';

  const audit = { log: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ClinicalNoteService.updateNote hides notes from other branches', async () => {
    const prisma = {
      clinicalNote: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'note-1',
          tenantId,
          encounterId: 'enc-1',
          lockedAt: null,
          subjective: 's',
          objective: 'o',
          assessment: 'a',
          plan: 'p',
        }),
      },
      encounter: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as any;

    const service = new ClinicalNoteService(prisma, audit as any);

    await expect(
      service.updateNote(
        tenantId,
        userId,
        'note-1',
        { subjective: 'x' },
        branchId,
      ),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.encounter.findFirst).toHaveBeenCalledWith({
      where: { id: 'enc-1', tenantId, branchId },
    });
  });

  it('PrescriptionService.getPrescription scopes reads by branch', async () => {
    const prisma = {
      prescription: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as any;

    const service = new PrescriptionService(prisma, audit as any);

    await expect(
      service.getPrescription(tenantId, 'rx-1', branchId),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.prescription.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rx-1', tenantId, branchId },
      }),
    );
  });

  it('PrescriptionService.cancelPrescription hides foreign-branch prescriptions', async () => {
    const prisma = {
      prescription: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as any;

    const service = new PrescriptionService(prisma, audit as any);

    await expect(
      service.cancelPrescription(tenantId, userId, 'rx-1', otherBranchId),
    ).rejects.toThrow(NotFoundException);
  });

  it('ReferralService.getReferral scopes reads by branch', async () => {
    const prisma = {
      referral: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as any;

    const service = new ReferralService(prisma, audit as any);

    await expect(
      service.getReferral(tenantId, 'ref-1', branchId),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.referral.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ref-1', tenantId, branchId },
      }),
    );
  });

  it('ReferralService.updateReferralStatus hides foreign-branch referrals', async () => {
    const prisma = {
      referral: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as any;

    const service = new ReferralService(prisma, audit as any);

    await expect(
      service.updateReferralStatus(
        tenantId,
        userId,
        'ref-1',
        { status: 'ACCEPTED' },
        branchId,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('DiagnosisService.removeDiagnosis hides foreign-branch encounters', async () => {
    const prisma = {
      encounter: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      encounterDiagnosis: {
        findFirst: jest.fn(),
      },
    } as any;

    const service = new DiagnosisService(prisma, audit as any);

    await expect(
      service.removeDiagnosis(
        tenantId,
        userId,
        'enc-1',
        'diag-1',
        undefined,
        branchId,
      ),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.encounter.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        id: 'enc-1',
        tenantId,
        branchId,
        archivedAt: null,
      }),
    });
    expect(prisma.encounterDiagnosis.findFirst).not.toHaveBeenCalled();
  });
});
