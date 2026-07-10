import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  AUTHORIZATION_PERMISSIONS,
  SYSTEM_ROLE_NAMES,
  SYSTEM_ROLE_PERMISSIONS,
} from './authorization-catalog';

const walkSourceFiles = (root: string): string[] => {
  if (!fs.existsSync(root)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', 'coverage'].includes(entry.name)) {
        files.push(...walkSourceFiles(target));
      }
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(target);
    }
  }
  return files;
};

const collectRequiredPermissionLiterals = (): Set<string> => {
  const required = new Set<string>();
  const roots = [
    path.resolve(process.cwd(), 'src'),
    path.resolve(process.cwd(), '../hms-frontend/src'),
  ];

  for (const file of roots.flatMap(walkSourceFiles)) {
    const source = fs.readFileSync(file, 'utf8');

    for (const match of source.matchAll(/@RequirePermissions\(([^)]*)\)/g)) {
      for (const value of match[1].matchAll(/['"]([^'"]+)['"]/g)) {
        required.add(value[1]);
      }
    }

    for (const match of source.matchAll(/\bpermission="([^"]+)"/g)) {
      required.add(match[1]);
    }

    for (const match of source.matchAll(/\bpermissions=\{\[([^\]]+)\]\}/g)) {
      for (const value of match[1].matchAll(/['"]([^'"]+)['"]/g)) {
        required.add(value[1]);
      }
    }
  }

  const frontendPermissionConfig = path.resolve(
    process.cwd(),
    '../hms-frontend/src/config/permissions.ts',
  );
  const configSource = fs.readFileSync(frontendPermissionConfig, 'utf8');
  for (const match of configSource.matchAll(
    /:\s*'([a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+)'/g,
  )) {
    required.add(match[1]);
  }

  return required;
};

describe('canonical authorization catalog', () => {
  const permissionNames = AUTHORIZATION_PERMISSIONS.map(({ name }) => name);
  const permissionSet = new Set(permissionNames);

  it('contains no duplicate permission names', () => {
    expect(permissionSet.size).toBe(permissionNames.length);
  });

  it('contains every permission referenced by backend and frontend guards', () => {
    const missing = [...collectRequiredPermissionLiterals()]
      .filter((permission) => !permissionSet.has(permission))
      .sort();

    expect(missing).toEqual([]);
  });

  it('maps every built-in role only to catalog permissions', () => {
    const unknownMappings = Object.entries(SYSTEM_ROLE_PERMISSIONS).flatMap(
      ([role, permissions]) =>
        permissions
          .filter((permission) => !permissionSet.has(permission))
          .map((permission) => `${role}:${permission}`),
    );

    expect(unknownMappings).toEqual([]);
    expect(SYSTEM_ROLE_NAMES).toEqual(Object.keys(SYSTEM_ROLE_PERMISSIONS));
  });

  it('gives Super Admin the complete catalog and Field Technician its operational grants', () => {
    expect(new Set(SYSTEM_ROLE_PERMISSIONS['Super Admin'])).toEqual(
      permissionSet,
    );
    expect(SYSTEM_ROLE_PERMISSIONS['Field Technician']).toEqual(
      expect.arrayContaining([
        'field_service.job.view',
        'field_service.job.update',
        'field_service.installation.update',
        'field_service.delivery.proof_create',
        'field_service.maintenance.update',
      ]),
    );
  });

  it('keeps the existing-tenant backfill migration synchronized with the catalog', () => {
    const migrationPath = path.resolve(
      process.cwd(),
      'prisma/migrations/20260710220000_backfill_authorization_catalog/migration.sql',
    );
    const migration = fs.readFileSync(migrationPath, 'utf8');

    expect(migration).toContain('DELETE FROM "role_permissions"');
    expect(migration).toContain('Built-in roles are immutable definitions');

    for (const permission of AUTHORIZATION_PERMISSIONS) {
      expect(migration).toContain(
        `('${permission.name}', '${permission.scope}', '${permission.riskLevel}')`,
      );
    }

    for (const [role, permissions] of Object.entries(SYSTEM_ROLE_PERMISSIONS)) {
      expect(migration).toContain(`('${role}')`);
      for (const permission of permissions) {
        expect(migration).toContain(`('${role}', '${permission}')`);
      }
    }
  });
});
