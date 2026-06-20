import { SetMetadata } from '@nestjs/common';

export const REQUIRE_BRANCH_CONTEXT_KEY = 'requireBranchContext';
export const BRANCH_BYPASS_ROLES_KEY = 'branchBypassRoles';

/**
 * Marks an endpoint as requiring branch context.
 * Optionally accepts an array of role names that bypass the branchId requirement.
 * Those roles can access the endpoint even without a branchId assigned.
 */
export const RequireBranchContext = (bypassRoles?: string[]) => {
  return (target: any, propertyKey?: string | symbol, descriptor?: any) => {
    const safeKey = propertyKey as string | symbol;
    SetMetadata(REQUIRE_BRANCH_CONTEXT_KEY, true)(target, safeKey, descriptor);
    if (bypassRoles && bypassRoles.length > 0) {
      SetMetadata(BRANCH_BYPASS_ROLES_KEY, bypassRoles)(
        target,
        safeKey,
        descriptor,
      );
    }
  };
};
