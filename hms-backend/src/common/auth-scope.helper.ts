import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { RequestUser } from './types/authenticated-request.type';

export class AuthScopeHelper {
  static assertTenantScope(user: RequestUser, tenantId: string) {
    if (!user.tenantId || user.tenantId !== tenantId) {
      throw new ForbiddenException('access_denied: tenant_isolation_violation');
    }
  }

  static assertBranchScope(user: RequestUser, branchId: string) {
    if (user.roles?.includes('Super Admin')) {
      return;
    }
    if (!user.branchId || user.branchId !== branchId) {
      throw new ForbiddenException('access_denied: branch_isolation_violation');
    }
  }

  static assertPatientOwnership(user: RequestUser, patientId: string) {
    if (user.roles?.includes('Patient')) {
      if (user.userId !== patientId) {
        throw new ForbiddenException('access_denied: patient_isolation_violation');
      }
      return;
    }
    const clinicalRoles = ['Doctor', 'Nurse', 'Lab Technician', 'Branch Admin', 'Super Admin'];
    const hasClinicalRole = user.roles?.some((role) => clinicalRoles.includes(role));
    if (!hasClinicalRole) {
      throw new ForbiddenException('access_denied: missing_clinical_role');
    }
  }

  static assertSupplierOwnership(user: RequestUser, supplierId: string) {
    if (user.roles?.includes('Super Admin')) {
      return;
    }
    if (!user.supplierId || user.supplierId !== supplierId) {
      throw new ForbiddenException('access_denied: supplier_isolation_violation');
    }
  }

  static assertBuyerOwnership(user: RequestUser, buyerId: string) {
    if (!user.userId || user.userId !== buyerId) {
      throw new ForbiddenException('access_denied: buyer_isolation_violation');
    }
  }

  static assertPermission(user: RequestUser, permission: string) {
    if (!user.permissions?.includes(permission)) {
      throw new ForbiddenException('access_denied: missing_required_permission');
    }
  }

  static assertAnyRole(user: RequestUser, roles: string[]) {
    const hasRole = user.roles?.some((role) => roles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('access_denied: missing_required_role');
    }
  }

  static requireAuditReason(action: string, reason?: string) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException(`audit_reason_required: reason is required for action ${action}`);
    }
  }
}
