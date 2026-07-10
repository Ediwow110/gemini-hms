import { resolveDefaultPortalPath } from './portal-resolver';

describe('resolveDefaultPortalPath', () => {
  it('uses the highest-priority built-in role', () => {
    expect(resolveDefaultPortalPath(['Doctor', 'Super Admin'])).toBe('/admin');
    expect(resolveDefaultPortalPath(['Nurse', 'Doctor'])).toBe('/doctor');
  });

  it('supports every field-service built-in role', () => {
    expect(resolveDefaultPortalPath(['Field Technician'])).toBe(
      '/field-service',
    );
    expect(resolveDefaultPortalPath(['Logistics Staff'])).toBe(
      '/field-service',
    );
    expect(resolveDefaultPortalPath(['Service Manager'])).toBe(
      '/field-service',
    );
  });

  it('derives a custom-role portal from permissions', () => {
    expect(
      resolveDefaultPortalPath(
        ['Delivery Coordinator'],
        ['field_service.job.view'],
      ),
    ).toBe('/field-service');
    expect(
      resolveDefaultPortalPath(
        ['Regional Compliance Reviewer'],
        ['compliance.audit.review'],
      ),
    ).toBe('/compliance');
  });

  it('fails closed when neither role nor permission maps to a portal', () => {
    expect(resolveDefaultPortalPath(['Unknown Role'])).toBe('/unauthorized');
    expect(resolveDefaultPortalPath([], [])).toBe('/unauthorized');
  });
});
