import { describe, it, expect } from 'vitest';
import { PERMISSIONS } from '../permissions';

describe('PERMISSIONS registry', () => {
  describe('drift fix: production-code literal strings are now represented', () => {
    it('includes patient.create (used by AppShell.tsx quick-create button)', () => {
      expect(PERMISSIONS.PATIENT_CREATE).toBe('patient.create');
    });

    it('includes it.system.view (used by App.tsx routes, roleNavigation.ts, portalRoutes.ts, AppShell.tsx)', () => {
      expect(PERMISSIONS.IT_SYSTEM_VIEW).toBe('it.system.view');
    });

    it('includes compliance.audit.review (used by App.tsx routes, AppShell.tsx)', () => {
      expect(PERMISSIONS.COMPLIANCE_AUDIT_REVIEW).toBe('compliance.audit.review');
    });

    it('all three new constants are present in Object.values(PERMISSIONS)', () => {
      const values = Object.values(PERMISSIONS);
      expect(values).toContain('patient.create');
      expect(values).toContain('it.system.view');
      expect(values).toContain('compliance.audit.review');
    });
  });

  describe('existing constants remain stable', () => {
    it('preserves patient.view', () => {
      expect(PERMISSIONS.PATIENT_VIEW).toBe('patient.view');
    });

    it('preserves queue.manage', () => {
      expect(PERMISSIONS.QUEUE_MANAGE).toBe('queue.manage');
    });

    it('preserves order.create', () => {
      expect(PERMISSIONS.ORDER_CREATE).toBe('order.create');
    });

    it('preserves admin.role.change', () => {
      expect(PERMISSIONS.ADMIN_ROLE_CHANGE).toBe('admin.role.change');
    });
  });

  describe('Permission type union is complete', () => {
    it('all PERMISSIONS values are strings', () => {
      for (const value of Object.values(PERMISSIONS)) {
        expect(typeof value).toBe('string');
      }
    });

    it('PERMISSIONS has no duplicate values', () => {
      const values = Object.values(PERMISSIONS);
      const unique = new Set(values);
      expect(unique.size).toBe(values.length);
    });
  });
});