import {
  ROLE_PRIORITY,
  ROLE_PORTAL_PATHS,
  normalizeRole,
  getPrimaryRole,
  getDefaultPortalPath,
  isKnownPortalPath,
  getSafePortalPath
} from './role-portal-resolver';

describe('Role Portal Resolver', () => {
  it('should normalize known role aliases', () => {
    expect(normalizeRole('Lab Technician')).toBe('Med-Tech');
    expect(normalizeRole('Finance')).toBe('Cashier');
    expect(normalizeRole('Unknown Role')).toBe('Unknown Role');
  });

  it('should get primary role based on priority', () => {
    expect(getPrimaryRole(['Doctor', 'Super Admin'])).toBe('Super Admin');
    expect(getPrimaryRole(['Nurse', 'Doctor'])).toBe('Doctor');
    expect(getPrimaryRole(['Patient'])).toBe('Patient');
    expect(getPrimaryRole([])).toBeNull();
  });

  it('should get default portal path', () => {
    expect(getDefaultPortalPath(['Branch Admin', 'Doctor'])).toBe('/branch-admin');
    expect(getDefaultPortalPath(['Doctor'])).toBe('/doctor');
    expect(getDefaultPortalPath(['Lab Technician'])).toBe('/lab'); // Via alias 'Med-Tech'
    expect(getDefaultPortalPath(['Unknown Role'])).toBe('/unauthorized');
    expect(getDefaultPortalPath([])).toBe('/unauthorized');
  });

  it('should check if a path is known', () => {
    expect(isKnownPortalPath('/admin')).toBe(true);
    expect(isKnownPortalPath('/doctor')).toBe(true);
    expect(isKnownPortalPath('/fake-path')).toBe(false);
  });

  it('should return safe portal path', () => {
    // If path is valid, return it
    expect(getSafePortalPath('/admin', ['Super Admin'])).toBe('/admin');
    
    // If path is invalid, fallback to default for roles
    expect(getSafePortalPath('/invalid-path', ['Doctor'])).toBe('/doctor');
    
    // If path is missing, fallback to default for roles
    expect(getSafePortalPath(undefined, ['Nurse'])).toBe('/nurse');
    
    // If no roles and invalid path, fallback to unauthorized
    expect(getSafePortalPath('/invalid-path', [])).toBe('/unauthorized');
  });
});
