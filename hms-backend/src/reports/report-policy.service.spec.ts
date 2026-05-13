import { Test, TestingModule } from '@nestjs/testing';
import { ReportPolicyService, ReportRiskLevel } from './report-policy.service';
import { BadRequestException } from '@nestjs/common';

describe('ReportPolicyService', () => {
  let service: ReportPolicyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportPolicyService],
    }).compile();

    service = module.get<ReportPolicyService>(ReportPolicyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects unknown report types', () => {
    expect(() => service.getPolicyForExport('UNKNOWN_TYPE')).toThrow(
      BadRequestException,
    );
  });

  it('returns valid policy for known report without specific fields', () => {
    const policy = service.getPolicyForExport(
      'CASHIER_REVERSAL_RECONCILIATION',
    );
    expect(policy.riskLevel).toBe(ReportRiskLevel.HIGH); // Elevated because 'amount' is HIGH
    expect(policy.allowedFields).toContain('id');
    expect(policy.allowedFields).toContain('amount');
  });

  it('rejects unallowlisted fields', () => {
    expect(() =>
      service.getPolicyForExport('CASHIER_REVERSAL_RECONCILIATION', [
        'unknown_field',
      ]),
    ).toThrow(BadRequestException);
  });

  it('computes risk level based on requested fields', () => {
    const policy = service.getPolicyForExport(
      'CASHIER_REVERSAL_RECONCILIATION',
      ['id', 'status', 'reason'],
    );
    expect(policy.riskLevel).toBe(ReportRiskLevel.MEDIUM); // Highest risk is reason (MEDIUM)
    expect(policy.allowedFields).toEqual(['id', 'status', 'reason']);
  });

  it('computes risk level as PRIVILEGED for sensitive fields', () => {
    const policy = service.getPolicyForExport('AUDIT_EVENTS_SUMMARY', [
      'oldValues',
      'newValues',
    ]);
    expect(policy.riskLevel).toBe(ReportRiskLevel.PRIVILEGED);
  });
});
