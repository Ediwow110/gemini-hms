import { describe, it, expect } from 'vitest';
import {
  normalizeRole,
  getPrimaryRole,
  getDefaultPortalPath,
  isKnownPortalPath,
  getSafePortalPath
} from '../role-portal-resolver';

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

  it('should return correct path for all known roles', () => {
    expect(getDefaultPortalPath(['Super Admin'])).toBe('/admin');
    expect(getDefaultPortalPath(['Branch Admin'])).toBe('/branch-admin');
    expect(getDefaultPortalPath(['Marketplace Admin'])).toBe('/marketplace-admin');
    expect(getDefaultPortalPath(['Compliance Officer'])).toBe('/compliance');
    expect(getDefaultPortalPath(['IT Support'])).toBe('/it');
    expect(getDefaultPortalPath(['HR Manager'])).toBe('/hr');
    expect(getDefaultPortalPath(['HR Staff'])).toBe('/hr');
    expect(getDefaultPortalPath(['Procurement Officer'])).toBe('/procurement');
    expect(getDefaultPortalPath(['Procurement Manager'])).toBe('/procurement');
    expect(getDefaultPortalPath(['Procurement Agent'])).toBe('/procurement');
    expect(getDefaultPortalPath(['Doctor'])).toBe('/doctor');
    expect(getDefaultPortalPath(['Nurse'])).toBe('/nurse');
    expect(getDefaultPortalPath(['Med-Tech'])).toBe('/lab');
    expect(getDefaultPortalPath(['Lab Technician'])).toBe('/lab');
    expect(getDefaultPortalPath(['Cashier'])).toBe('/cashier');
    expect(getDefaultPortalPath(['Finance'])).toBe('/cashier');
    expect(getDefaultPortalPath(['Pharmacist'])).toBe('/pharmacy');
    expect(getDefaultPortalPath(['Supplier'])).toBe('/supplier');
    expect(getDefaultPortalPath(['Supplier Admin'])).toBe('/supplier');
    expect(getDefaultPortalPath(['Marketplace Supplier'])).toBe('/supplier');
    expect(getDefaultPortalPath(['Marketplace Buyer'])).toBe('/marketplace');
    expect(getDefaultPortalPath(['Customer'])).toBe('/marketplace');
    expect(getDefaultPortalPath(['Patient'])).toBe('/patient');
    expect(getDefaultPortalPath(['Field Technician'])).toBe('/field-service');
    expect(getDefaultPortalPath(['Receptionist'])).toBe('/queue');
  });

  it('should get default portal path for fallback scenarios', () => {
    expect(getDefaultPortalPath(['Unknown Role'])).toBe('/unauthorized');
    expect(getDefaultPortalPath([])).toBe('/unauthorized');
  });

  it('should check if a path is known', () => {
    expect(isKnownPortalPath('/admin')).toBe(true);
    expect(isKnownPortalPath('/doctor')).toBe(true);
    expect(isKnownPortalPath('/fake-path')).toBe(false);
  });

  it('should return safe portal path', () => {
    expect(getSafePortalPath('/admin', ['Super Admin'])).toBe('/admin');
    expect(getSafePortalPath('/invalid-path', ['Doctor'])).toBe('/doctor');
    expect(getSafePortalPath(undefined, ['Nurse'])).toBe('/nurse');
    expect(getSafePortalPath('/invalid-path', [])).toBe('/unauthorized');
  });
});
