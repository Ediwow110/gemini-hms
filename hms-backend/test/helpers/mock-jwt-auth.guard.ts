import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

export const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';

@Injectable()
export class MockJwtAuthGuard implements CanActivate {
  public static user = {
    userId: TEST_USER_ID,
    tenantId: '123e4567-e89b-12d3-a456-426614174000',
    branchId: '123e4567-e89b-12d3-a456-426614174001',
    roles: ['admin'],
    permissions: ['*'],
    email: 'test@hms.local',
  };

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = { ...MockJwtAuthGuard.user };
    return true;
  }
}
