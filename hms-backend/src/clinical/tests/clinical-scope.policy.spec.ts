import { ClinicalScopePolicy } from '../clinical-workflow.policy';
import { ForbiddenException } from '@nestjs/common';
import { RequestUser } from '../../common/types/authenticated-request.type';

describe('ClinicalScopePolicy', () => {
  const doctorUser: RequestUser = {
    userId: 'doc-1',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    roles: ['Doctor'],
  };

  const patientUser: RequestUser = {
    userId: 'pat-1',
    tenantId: 'tenant-1',
    roles: ['Patient'],
  };

  const cashierUser: RequestUser = {
    userId: 'cash-1',
    tenantId: 'tenant-1',
    roles: ['Cashier'],
  };

  const superAdminUser: RequestUser = {
    userId: 'admin-1',
    tenantId: 'tenant-1',
    roles: ['Super Admin'],
  };

  describe('authorizeBranch', () => {
    it('should allow staff in same branch', () => {
      expect(() =>
        ClinicalScopePolicy.authorizeBranch(doctorUser, 'branch-1'),
      ).not.toThrow();
    });

    it('should throw for staff in different branch', () => {
      expect(() =>
        ClinicalScopePolicy.authorizeBranch(doctorUser, 'branch-2'),
      ).toThrow(ForbiddenException);
    });

    it('should allow Super Admin across branches', () => {
      expect(() =>
        ClinicalScopePolicy.authorizeBranch(superAdminUser, 'branch-2'),
      ).not.toThrow();
    });
  });

  describe('authorizePatientAccess', () => {
    it('should allow clinical staff to access patient', () => {
      expect(() =>
        ClinicalScopePolicy.authorizePatientAccess(doctorUser, 'pat-1'),
      ).not.toThrow();
    });

    it('should allow patient to access self', () => {
      expect(() =>
        ClinicalScopePolicy.authorizePatientAccess(patientUser, 'pat-1'),
      ).not.toThrow();
    });

    it('should block patient from accessing other patient', () => {
      expect(() =>
        ClinicalScopePolicy.authorizePatientAccess(patientUser, 'pat-2'),
      ).toThrow(ForbiddenException);
    });

    it('should block non-clinical non-self roles', () => {
      expect(() =>
        ClinicalScopePolicy.authorizePatientAccess(cashierUser, 'pat-1'),
      ).toThrow(ForbiddenException);
    });
  });

  describe('filterSensitiveContent', () => {
    it('should allow clinical staff to see internal notes', () => {
      expect(
        ClinicalScopePolicy.filterSensitiveContent(doctorUser, 'NOTE', false),
      ).toBe(true);
    });

    it('should block patients from seeing internal notes', () => {
      expect(
        ClinicalScopePolicy.filterSensitiveContent(patientUser, 'NOTE', false),
      ).toBe(false);
    });

    it('should allow patients to see released results', () => {
      expect(
        ClinicalScopePolicy.filterSensitiveContent(patientUser, 'LAB', true),
      ).toBe(true);
    });

    it('should block cashiers from seeing clinical notes', () => {
      expect(
        ClinicalScopePolicy.filterSensitiveContent(cashierUser, 'NOTE', true),
      ).toBe(false);
    });
  });
});
