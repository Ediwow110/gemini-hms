#!/usr/bin/env node
/**
 * Branding Guard Verifier
 *
 * Checks that no unsupported compliance or production-readiness claims
 * have been introduced in source code or documentation.
 *
 * Usage: node scripts/verify-branding-guard.js
 * Exit code: 0 = PASS (no violations), 1 = FAIL (violations found)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FORBIDDEN_PATTERNS = [
  'HIPAA Compliant',
  'SOC2 Certified',
  'SOC 2 Certified',
  'Enterprise Ready',
  'Built for Production',
  'Production Ready',
];

// Patterns that are allowed (explicit disclaimers or documentation of the guard itself)
const ALLOWED_PATTERNS = [
  'NOT Production Ready',
  'NOT SOC2 Certified',
  'NOT SOC 2 Certified',
  'NOT HIPAA Compliant',
  'not production-ready',
  'not SOC 2',
  'not HIPAA',
  'no production-readiness',
  'No production-readiness',
  'No HIPAA compliance claim',
  'No SOC 2 certification claim',
  'no production deployment',
  'No deployment',
  'staging-only',
  'STAGING-ONLY',
  'branding guard',
  'Branding Guard',
  'grep -n',
  'smoke-test check pattern',
  // Disclaimers saying what we do NOT claim
  '"Production Ready"',
  'Production Ready, etc.',
  '"HIPAA/SOC2 Certified."',
  '"Not Production Ready"',
  'Maintain "Not',
  'No HIPAA Compliant',  // explicit disclaimer
  'No "Enterprise Ready"',
  'No "Built for Production"',
  'no HIPAA compliance validation',
  'no SOC 2 certification audit',
  'no enterprise hardening',
];

let exitCode = 0;
const violations = [];

// Search for forbidden patterns
const grepCmd = `git grep -n "HIPAA Compliant\\|SOC2 Certified\\|SOC 2 Certified\\|Enterprise Ready\\|Built for Production\\|Production Ready" -- docs/ hms-frontend/ hms-backend/ ':(exclude)*node_modules*' || true`;

try {
  const output = execSync(
    'git grep -n "HIPAA Compliant\\|SOC2 Certified\\|SOC 2 Certified\\|Enterprise Ready\\|Built for Production\\|Production Ready" -- docs/ hms-frontend/ hms-backend/ || true',
    { cwd: path.resolve(__dirname, '..'), encoding: 'utf-8' }
  );
  const lines = output.trim().split('\n').filter(Boolean);

  for (const line of lines) {
    // Check if this line is an allowed disclaimer
    const isAllowed = ALLOWED_PATTERNS.some(pattern => line.includes(pattern));
    if (!isAllowed) {
      violations.push(line);
    }
  }
} catch (err) {
  console.error('Error running git grep:', err.message);
  exitCode = 1;
}

if (violations.length > 0) {
  console.log('BRANDING GUARD VIOLATIONS FOUND:');
  for (const v of violations) {
    console.log('  ' + v);
  }
  exitCode = 1;
}

console.log('\n--- Branding Guard Verifier ---');
console.log('Checked patterns: ' + FORBIDDEN_PATTERNS.join(', '));
console.log('Files scanned: docs/, hms-frontend/, hms-backend/');
console.log('Violations: ' + violations.length);

if (exitCode === 0) {
  console.log('\nRESULT: PASS - No unsupported claims found.');
} else {
  console.log('\nRESULT: FAIL - Violations found (see above).');
}

process.exit(exitCode);
