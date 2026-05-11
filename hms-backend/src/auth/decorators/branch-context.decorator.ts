import { SetMetadata } from '@nestjs/common';

export const REQUIRE_BRANCH_CONTEXT_KEY = 'requireBranchContext';
export const RequireBranchContext = () =>
  SetMetadata(REQUIRE_BRANCH_CONTEXT_KEY, true);
