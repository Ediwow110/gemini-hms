/**
 * Tenant creation boundary enforcement.
 *
 * INVARIANT:
 *   Production tenant creation MUST go through the CLI provisioning script
 *   (scripts/provision-tenant.ts) or the canonical provisionSystemActor()
 *   helper (src/tenant/tenant-provisioning.ts).  There is NO runtime API
 *   for tenant creation — no TenantController, no TenantModule.
 *
 *   This test ensures no production source file in src/ calls
 *   `prisma.tenant.create` or `prisma.tenant.createMany` directly,
 *   which would bypass the system-actor provisioning invariant.
 *
 *   Scripts, seeds, E2E tests and migration helpers are exempt.
 */

import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..', '..'); // backend root
const SRC_DIR = path.resolve(REPO_ROOT, 'src');

describe('tenant creation boundary', () => {
  const EXEMPT_PATTERNS = [
    /tenant-provisioning\.ts$/, // canonical helper
  ];

  const BANNED_PATTERNS = [
    /\.tenant\.create\s*\(/,
    /\.tenant\.createMany\s*\(/,
    /INSERT\s+INTO\s+"?tenants"?/i,
  ];

  function walkDir(dir: string): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (
          !entry.name.startsWith('__pycache__') &&
          entry.name !== 'node_modules'
        ) {
          results.push(...walkDir(full));
        }
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        results.push(full);
      }
    }
    return results;
  }

  const srcFiles = walkDir(SRC_DIR).filter(
    (f) => !EXEMPT_PATTERNS.some((p) => p.test(f)),
  );

  for (const file of srcFiles) {
    const relative = path.relative(REPO_ROOT, file);
    const content = fs.readFileSync(file, 'utf-8');

    for (const pattern of BANNED_PATTERNS) {
      const matches = content.match(new RegExp(pattern.source, 'g'));
      if (matches) {
        // Only fail for production patterns (not comments)
        for (const match of content.split('\n').entries()) {
          const [lineIdx, line] = match;
          if (
            pattern.test(line) &&
            !line.trim().startsWith('//') &&
            !line.trim().startsWith('*')
          ) {
            it(`must not contain "${pattern.source}" (${relative}:${lineIdx + 1})`, () => {
              expect(line).not.toMatch(pattern);
            });
          }
        }
      }
    }
  }

  it('enforces that only CLI scripts create tenants in production', () => {
    // This always passes — the real check is the per-file loop above.
    // If any file triggers a failure above, this suite will show which one.
    expect(true).toBe(true);
  });
});
