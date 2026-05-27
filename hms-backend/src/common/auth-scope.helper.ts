import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { RequestUser } from './types/authenticated-request.type';

export interface ScopeOverrideOptions {
  allowGovernanceOverride?: boolean;
  allowedGovernanceRoles?: string[];
  allowClinicalOverride?: boolean;
  allowedClinicalRoles?: string[];
  reason?: string;
}

export class AuthScopeHelper {
  static assertTenantScope(user: RequestUser, tenantId: string, options?: ScopeOverrideOptions) {
    if (user.roles?.includes('Super Admin') && options?.allowGovernanceOverride) {
      if (options?.reason) {
        this.requireAuditReason('tenant_governance_override', options.reason);
      }
      return;
    }
    if (!user.tenantId || user.tenantId !== tenantId) {
      throw new ForbiddenException('access_denied: tenant_isolation_violation');
    }
  }

  static assertBranchScope(user: RequestUser, branchId: string, options?: ScopeOverrideOptions) {
    if (user.roles?.includes('Super Admin') && options?.allowGovernanceOverride) {
      if (options?.reason) {
        this.requireAuditReason('branch_governance_override', options.reason);
      }
      return;
    }
    if (!user.branchId || user.branchId !== branchId) {
      throw new ForbiddenException('access_denied: branch_isolation_violation');
    }
  }

  static assertPatientOwnership(user: RequestUser, patientId: string, options?: ScopeOverrideOptions) {
    if (user.roles?.includes('Patient')) {
      if (user.userId !== patientId) {
        throw new ForbiddenException('access_denied: patient_isolation_violation');
      }
      return;
    }

    if (options?.allowGovernanceOverride) {
      const allowedRoles = options.allowedGovernanceRoles ?? ['Super Admin', 'Branch Admin'];
      const hasGovRole = user.roles?.some((role) => allowedRoles.includes(role));
      if (hasGovRole) {
        this.requireAuditReason('patient_governance_override', options.reason);
        return;
      }
    }

    if (options?.allowClinicalOverride) {
      const allowedRoles = options.allowedClinicalRoles ?? ['Doctor', 'Nurse', 'Lab Technician'];
      const hasClinicalRole = user.roles?.some((role) => allowedRoles.includes(role));
      if (hasClinicalRole) {
        return;
      }
    }

    throw new ForbiddenException('access_denied: patient_isolation_violation');
  }

  static assertSupplierOwnership(user: RequestUser, supplierId: string, options?: ScopeOverrideOptions) {
    if (options?.allowGovernanceOverride) {
      const allowedRoles = options.allowedGovernanceRoles ?? ['Super Admin', 'Marketplace Admin'];
      const hasGovRole = user.roles?.some((role) => allowedRoles.includes(role));
      if (hasGovRole) {
        this.requireAuditReason('supplier_governance_override', options.reason);
        return;
      }
    }

    if (user.roles?.includes('Supplier') && user.supplierId === supplierId) {
      return;
    }

    throw new ForbiddenException('access_denied: supplier_isolation_violation');
  }

  static assertBuyerOwnership(user: RequestUser, buyerId: string, options?: ScopeOverrideOptions) {
    if (options?.allowGovernanceOverride) {
      const allowedRoles = options.allowedGovernanceRoles ?? ['Super Admin', 'Branch Admin', 'Procurement Manager', 'Procurement Agent'];
      const hasGovRole = user.roles?.some((role) => allowedRoles.includes(role));
      if (hasGovRole) {
        this.requireAuditReason('buyer_governance_override', options.reason);
        return;
      }
    }

    if (user.roles?.includes('Marketplace Buyer') && user.userId === buyerId) {
      return;
    }

    throw new ForbiddenException('access_denied: buyer_isolation_violation');
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
