import { ForbiddenException } from '@nestjs/common';
import { RequestUser } from '../common/types/authenticated-request.type';

/**
 * CLINICAL SCOPE POLICY
 *
 * This policy enforces isolation boundaries for clinical operations.
 * - Clinical staff must be branch-scoped.
 * - Patient data must be protected based on role.
 * - PHI must not leak cross-branch.
 */
export class ClinicalScopePolicy {
  /**
   * Enforces absolute tenant isolation.
   */
  static authorizeTenant(user: RequestUser, targetTenantId: string) {
    if (!user.tenantId || user.tenantId !== targetTenantId) {
      throw new ForbiddenException('access_denied: tenant_isolation_violation');
    }
  }

  /**
   * Enforces branch-level scoping for non-Super Admin clinical staff.
   */
  static authorizeBranch(user: RequestUser, targetBranchId: string) {
    if (user.roles?.includes('Super Admin')) {
      return;
    }
    if (!user.branchId || user.branchId !== targetBranchId) {
      throw new ForbiddenException('access_denied: branch_isolation_violation');
    }
  }

  /**
   * Validates if a user can access a specific patient's clinical data.
   */
  static authorizePatientAccess(user: RequestUser, patientId: string) {
    if (user.roles?.includes('Patient')) {
      if (user.userId !== patientId) {
        throw new ForbiddenException(
          'access_denied: patient_isolation_violation',
        );
      }
      return;
    }
    // Staff access is allowed if they have the right roles (Doctor, Nurse, etc.)
    // and are in the correct branch (handled by authorizeBranch).
    const clinicalRoles = [
      'Doctor',
      'Nurse',
      'Lab Technician',
      'Branch Admin',
      'Super Admin',
    ];
    const hasClinicalRole = user.roles?.some((role) =>
      clinicalRoles.includes(role),
    );

    if (!hasClinicalRole) {
      throw new ForbiddenException('access_denied: missing_clinical_role');
    }
  }

  /**
   * Filters sensitive PHI content based on user role.
   * Internal SOAP notes and unreleased lab results should be hidden from non-clinical staff.
   */
  static filterSensitiveContent(
    user: RequestUser,
    recordType: 'ENCOUNTER' | 'LAB' | 'NOTE',
    isReleased: boolean,
  ): boolean {
    if (user.roles?.includes('Super Admin')) return true;

    if (user.roles?.includes('Patient')) {
      // Patients only see released content
      return isReleased;
    }

    if (user.roles?.includes('Cashier')) {
      // Cashiers only see billing-related released content, no clinical notes
      if (recordType === 'NOTE') return false;
      return isReleased;
    }

    // Default: Clinical staff (Doctor, Nurse) can see both released and internal for their branch
    return true;
  }
}
