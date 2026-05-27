import { AuthScopeHelper } from '../auth-scope.helper';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { RequestUser } from '../types/authenticated-request.type';

describe('AuthScopeHelper', () => {
  const patientUser: RequestUser = {
    userId: 'patient-123',
    tenantId: 'tenant-1',
    roles: ['Patient'],
  };

  const doctorUser: RequestUser = {
    userId: 'doctor-456',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    roles: ['Doctor'],
  };

  const superAdminUser: RequestUser = {
    userId: 'admin-789',
    tenantId: 'tenant-1',
    roles: ['Super Admin'],
  };

  const branchAdminUser: RequestUser = {
    userId: 'branchadmin-999',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    roles: ['Branch Admin'],
  };

  const supplierUser: RequestUser = {
    userId: 'supplier-abc',
    tenantId: 'tenant-1',
    supplierId: 'supplier-1',
    roles: ['Supplier'],
  };

  const buyerUser: RequestUser = {
    userId: 'buyer-xyz',
    tenantId: 'tenant-1',
    roles: ['Marketplace Buyer'],
  };

  describe('assertTenantScope', () => {
    it('should pass if user tenant matches', () => {
      expect(() => AuthScopeHelper.assertTenantScope(patientUser, 'tenant-1')).not.toThrow();
    });

    it('should throw ForbiddenException if user tenant mismatches', () => {
      expect(() => AuthScopeHelper.assertTenantScope(patientUser, 'tenant-2')).toThrow(ForbiddenException);
    });

    it('should block Super Admin by default on mismatch', () => {
      expect(() => AuthScopeHelper.assertTenantScope(superAdminUser, 'tenant-other')).toThrow(ForbiddenException);
    });

    it('should allow Super Admin with explicit override', () => {
      expect(() =>
        AuthScopeHelper.assertTenantScope(superAdminUser, 'tenant-other', {
          allowGovernanceOverride: true,
          reason: 'Global platform system sync',
        }),
      ).not.toThrow();
    });
  });

  describe('assertBranchScope', () => {
    it('should pass if user branch matches', () => {
      expect(() => AuthScopeHelper.assertBranchScope(doctorUser, 'branch-1')).not.toThrow();
    });

    it('should throw ForbiddenException if user branch mismatches', () => {
      expect(() => AuthScopeHelper.assertBranchScope(doctorUser, 'branch-2')).toThrow(ForbiddenException);
    });

    it('should block Super Admin by default on mismatch', () => {
      expect(() => AuthScopeHelper.assertBranchScope(superAdminUser, 'branch-2')).toThrow(ForbiddenException);
    });

    it('should allow Super Admin with explicit override', () => {
      expect(() =>
        AuthScopeHelper.assertBranchScope(superAdminUser, 'branch-2', {
          allowGovernanceOverride: true,
          reason: 'Emergency branch maintenance',
        }),
      ).not.toThrow();
    });
  });

  describe('assertPatientOwnership', () => {
    it('should allow patient to access own record', () => {
      expect(() => AuthScopeHelper.assertPatientOwnership(patientUser, 'patient-123')).not.toThrow();
    });

    it('should block patient from accessing other record', () => {
      expect(() => AuthScopeHelper.assertPatientOwnership(patientUser, 'patient-other')).toThrow(ForbiddenException);
    });

    it('should block clinical staff (Doctor) by default', () => {
      expect(() => AuthScopeHelper.assertPatientOwnership(doctorUser, 'patient-123')).toThrow(ForbiddenException);
    });

    it('should allow clinical staff with explicit override options', () => {
      expect(() =>
        AuthScopeHelper.assertPatientOwnership(doctorUser, 'patient-123', {
          allowClinicalOverride: true,
        }),
      ).not.toThrow();
    });

    it('should block Super Admin by default', () => {
      expect(() => AuthScopeHelper.assertPatientOwnership(superAdminUser, 'patient-123')).toThrow(ForbiddenException);
    });

    it('should allow Super Admin with explicit override and reason', () => {
      expect(() =>
        AuthScopeHelper.assertPatientOwnership(superAdminUser, 'patient-123', {
          allowGovernanceOverride: true,
          reason: 'Compliance audit investigation',
        }),
      ).not.toThrow();
    });

    it('should throw if governance override reason is missing', () => {
      expect(() =>
        AuthScopeHelper.assertPatientOwnership(superAdminUser, 'patient-123', {
          allowGovernanceOverride: true,
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe('assertSupplierOwnership', () => {
    it('should allow supplier to access own supplierId data', () => {
      expect(() => AuthScopeHelper.assertSupplierOwnership(supplierUser, 'supplier-1')).not.toThrow();
    });

    it('should block supplier from accessing other supplier data', () => {
      expect(() => AuthScopeHelper.assertSupplierOwnership(supplierUser, 'supplier-other')).toThrow(ForbiddenException);
    });

    it('should block Super Admin by default', () => {
      expect(() => AuthScopeHelper.assertSupplierOwnership(superAdminUser, 'supplier-1')).toThrow(ForbiddenException);
    });

    it('should allow Super Admin with explicit override and reason', () => {
      expect(() =>
        AuthScopeHelper.assertSupplierOwnership(superAdminUser, 'supplier-1', {
          allowGovernanceOverride: true,
          reason: 'Supplier catalog moderation review',
        }),
      ).not.toThrow();
    });

    it('should block Branch Admin by default', () => {
      expect(() => AuthScopeHelper.assertSupplierOwnership(branchAdminUser, 'supplier-1')).toThrow(ForbiddenException);
    });
  });

  describe('assertBuyerOwnership', () => {
    it('should allow buyer to access own data', () => {
      expect(() => AuthScopeHelper.assertBuyerOwnership(buyerUser, 'buyer-xyz')).not.toThrow();
    });

    it('should block buyer from accessing other buyer data', () => {
      expect(() => AuthScopeHelper.assertBuyerOwnership(buyerUser, 'buyer-other')).toThrow(ForbiddenException);
    });

    it('should block Super Admin by default', () => {
      expect(() => AuthScopeHelper.assertBuyerOwnership(superAdminUser, 'buyer-xyz')).toThrow(ForbiddenException);
    });

    it('should allow Super Admin with explicit override and reason', () => {
      expect(() =>
        AuthScopeHelper.assertBuyerOwnership(superAdminUser, 'buyer-xyz', {
          allowGovernanceOverride: true,
          reason: 'Buyer billing audit',
        }),
      ).not.toThrow();
    });
  });

  describe('assertPermission', () => {
    it('should pass if user has target permission', () => {
      const permissionUser: RequestUser = { tenantId: 'tenant-1', permissions: ['edit_records'] };
      expect(() => AuthScopeHelper.assertPermission(permissionUser, 'edit_records')).not.toThrow();
    });

    it('should throw if user lacks target permission', () => {
      const permissionUser: RequestUser = { tenantId: 'tenant-1', permissions: [] };
      expect(() => AuthScopeHelper.assertPermission(permissionUser, 'edit_records')).toThrow(ForbiddenException);
    });
  });

  describe('assertAnyRole', () => {
    it('should pass if user has one of target roles', () => {
      expect(() => AuthScopeHelper.assertAnyRole(doctorUser, ['Doctor', 'Nurse'])).not.toThrow();
    });

    it('should throw if user has none of target roles', () => {
      expect(() => AuthScopeHelper.assertAnyRole(doctorUser, ['Nurse', 'Lab Technician'])).toThrow(ForbiddenException);
    });
  });

  describe('requireAuditReason', () => {
    it('should pass if reason is provided', () => {
      expect(() => AuthScopeHelper.requireAuditReason('suspend_user', 'User violated compliance policies')).not.toThrow();
    });

    it('should throw BadRequestException if reason is missing or empty', () => {
      expect(() => AuthScopeHelper.requireAuditReason('suspend_user', '')).toThrow(BadRequestException);
      expect(() => AuthScopeHelper.requireAuditReason('suspend_user', '   ')).toThrow(BadRequestException);
    });
  });
});
