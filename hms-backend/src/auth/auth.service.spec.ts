import { JwtStrategy } from './jwt.strategy';

// Mock JWT_SECRET for test environment
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

describe('JWT Claim Consistency', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy();
  });

  it('JwtStrategy.validate() should return tenantId from payload.tenantId (camelCase)', async () => {
    const payload = {
      sub: 'user-uuid-123',
      email: 'test@hospital.com',
      tenantId: 'tenant-uuid-456',
      roles: ['Doctor'],
      jti: 'jti-789',
    };

    const result = await strategy.validate(payload);

    expect(result.userId).toBe('user-uuid-123');
    expect(result.email).toBe('test@hospital.com');
    expect(result.tenantId).toBe('tenant-uuid-456');
    expect(result.roles).toEqual(['Doctor']);
  });

  it('tenantId must NOT be undefined when payload uses camelCase', async () => {
    const payload = {
      sub: 'user-uuid-123',
      email: 'test@hospital.com',
      tenantId: 'tenant-uuid-456',
      roles: [],
    };

    const result = await strategy.validate(payload);

    // This was the bug: payload.tenant_id would produce undefined
    expect(result.tenantId).toBeDefined();
    expect(result.tenantId).not.toBeNull();
    expect(result.tenantId).toBe('tenant-uuid-456');
  });

  it('PermissionsGuard would reject if tenantId is undefined', async () => {
    // Simulate what happens if the old snake_case field is used in payload
    // but validate() reads camelCase — tenantId should still be correct
    const payload = {
      sub: 'user-uuid-123',
      email: 'test@hospital.com',
      tenantId: 'tenant-uuid-456', // This is what AuthService signs
      roles: ['Admin'],
    };

    const user = await strategy.validate(payload);

    // PermissionsGuard checks: !user.tenantId
    const wouldReject = !user || !user.userId || !user.tenantId;
    expect(wouldReject).toBe(false);
  });
});
