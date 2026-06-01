#!/usr/bin/env node
/**
 * Verify No Committed Backups
 *
 * Checks that no SQL dump/backup/snapshot files are committed.
 * Excludes legitimate files: Prisma migrations, schema definitions,
 * documentation, scripts with "backup" in name, TypeScript source files.
 *
 * Usage: node scripts/verify-no-committed-backups.js
 * Exit code: 0 = PASS, 1 = FAIL
 */

const { execSync } = require('child_process');
const path = require('path');

// Files that contain 'backup' or 'restore' are legitimate (scripts, docs, source)
function isLegitimate(file) {
  const lower = file.toLowerCase();
  // .sql files under prisma/migrations are schema files
  if (lower.startsWith('hms-backend/prisma/migrations/')) return true;
  // .sql files under foundational-core/database are schema files
  if (lower.startsWith('hms-foundational-core/database/')) return true;
  // .ts and .tsx files are source code
  if (lower.endsWith('.ts') || lower.endsWith('.tsx') || lower.endsWith('.js') || lower.endsWith('.jsx')) return true;
  // .md files are documentation
  if (lower.endsWith('.md')) return true;
  // .sh files are scripts
  if (lower.endsWith('.sh')) return true;
  // .yml files are configuration
  if (lower.endsWith('.yml')) return true;
  // .json files are configuration
  if (lower.endsWith('.json')) return true;
  // Node_modules
  if (lower.includes('node_modules/')) return true;
  return false;
}

let exitCode = 0;

try {
  const output = execSync(
    'git ls-files',
    { cwd: path.resolve(__dirname, '..'), encoding: 'utf-8' }
  );
  const allFiles = output.trim().split('\n').filter(Boolean);

  // Flag only files that look like actual data backup dumps (not scripts/docs)
  const suspiciousFiles = allFiles.filter(f => {
    if (isLegitimate(f)) return false;
    const lower = f.toLowerCase();
    // Flag files with actual data backup extensions/patterns
    return lower.endsWith('.sql') || lower.endsWith('.dump') || lower.includes('/backups/');
  });

  if (suspiciousFiles.length > 0) {
    console.log('SUSPICIOUS BACKUP FILES FOUND:');
    for (const f of suspiciousFiles) {
      console.log('  ' + f);
    }
    exitCode = 1;
  } else {
    console.log('No committed backup dump files found.');
  }
} catch (err) {
  console.error('Error:', err.message);
  exitCode = 1;
}

console.log('\n--- Backup File Verifier ---');
if (exitCode === 0) {
  console.log('RESULT: PASS - No backup dump files committed.');
} else {
  console.log('RESULT: FAIL - Suspicious files found (see above).');
}

process.exit(exitCode);
