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
  });

  describe('assertBranchScope', () => {
    it('should pass if user branch matches', () => {
      expect(() => AuthScopeHelper.assertBranchScope(doctorUser, 'branch-1')).not.toThrow();
    });

    it('should throw ForbiddenException if user branch mismatches', () => {
      expect(() => AuthScopeHelper.assertBranchScope(doctorUser, 'branch-2')).toThrow(ForbiddenException);
    });

    it('should bypass branch check for Super Admin', () => {
      expect(() => AuthScopeHelper.assertBranchScope(superAdminUser, 'branch-2')).not.toThrow();
    });
  });

  describe('assertPatientOwnership', () => {
    it('should allow patient to access own record', () => {
      expect(() => AuthScopeHelper.assertPatientOwnership(patientUser, 'patient-123')).not.toThrow();
    });

    it('should block patient from accessing other record', () => {
      expect(() => AuthScopeHelper.assertPatientOwnership(patientUser, 'patient-other')).toThrow(ForbiddenException);
    });

    it('should allow clinical staff to access patient records', () => {
      expect(() => AuthScopeHelper.assertPatientOwnership(doctorUser, 'patient-123')).not.toThrow();
    });

    it('should block non-clinical staff/roles', () => {
      const cashierUser: RequestUser = { userId: 'cashier-1', tenantId: 'tenant-1', roles: ['Cashier'] };
      expect(() => AuthScopeHelper.assertPatientOwnership(cashierUser, 'patient-123')).toThrow(ForbiddenException);
    });
  });

  describe('assertSupplierOwnership', () => {
    it('should allow supplier to access own supplierId data', () => {
      expect(() => AuthScopeHelper.assertSupplierOwnership(supplierUser, 'supplier-1')).not.toThrow();
    });

    it('should block supplier from accessing other supplier data', () => {
      expect(() => AuthScopeHelper.assertSupplierOwnership(supplierUser, 'supplier-other')).toThrow(ForbiddenException);
    });

    it('should bypass supplier check for Super Admin', () => {
      expect(() => AuthScopeHelper.assertSupplierOwnership(superAdminUser, 'supplier-other')).not.toThrow();
    });
  });

  describe('assertBuyerOwnership', () => {
    it('should allow buyer to access own data', () => {
      expect(() => AuthScopeHelper.assertBuyerOwnership(buyerUser, 'buyer-xyz')).not.toThrow();
    });

    it('should block buyer from accessing other buyer data', () => {
      expect(() => AuthScopeHelper.assertBuyerOwnership(buyerUser, 'buyer-other')).toThrow(ForbiddenException);
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
