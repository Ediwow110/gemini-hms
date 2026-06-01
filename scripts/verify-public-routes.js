#!/usr/bin/env node
/**
 * Public Route Exposure Verifier
 *
 * Scans backend controller files for @Public() decorators (both method-level
 * and class-level), identifies HTTP method decorators, and compares against
 * the allowlist in docs/security/public-route-allowlist.json.
 *
 * Fails when:
 * - A new @Public() route appears without allowlist entry
 * - Allowlist references a missing route file/handler
 * - Known public routes change path/method without allowlist update
 *
 * Limitations:
 * - Uses line-based scanning (not AST parsing)
 * - Does not infer the full route prefix from module/controller decorators
 * - Conservative: reports warnings for uncertain matches
 *
 * Usage: node scripts/verify-public-routes.js
 * Exit code: 0 = PASS, 1 = FAIL
 */

const fs = require('fs');
const path = require('path');

const ALLOWLIST_PATH = path.resolve(__dirname, '..', 'docs', 'security', 'public-route-allowlist.json');
const BACKEND_SRC = path.resolve(__dirname, '..', 'hms-backend', 'src');

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

let exitCode = 0;
const errors = [];
const warnings = [];

// Load allowlist
let allowlist;
try {
  allowlist = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf-8'));
  if (!Array.isArray(allowlist)) {
    errors.push('FAIL: Allowlist is not an array');
    exitCode = 1;
    printResults();
    process.exit(exitCode);
  }
} catch (err) {
  errors.push('FAIL: Cannot read allowlist: ' + err.message);
  exitCode = 1;
  printResults();
  process.exit(exitCode);
}

// Build a lookup map from allowlist: key = file:handler
const allowlistMap = new Map();
for (const entry of allowlist) {
  const key = entry.file + ':' + entry.handler;
  allowlistMap.set(key, entry);
}

/**
 * Recursively find all controller .ts files in the backend src directory.
 */
function findControllerFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      results.push(...findControllerFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.controller.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Determine if a line is a class-level @Public() decorator.
 */
function isClassLevelPublic(lines, lineIndex) {
  for (let j = lineIndex + 1; j < Math.min(lineIndex + 15, lines.length); j++) {
    const nextLine = lines[j].trim();
    if (!nextLine || nextLine.startsWith('//') || nextLine.startsWith('*')) continue;
    if (nextLine.startsWith('@')) continue;
    if (nextLine.startsWith('export class') || nextLine.startsWith('class ')) {
      return true;
    }
    return false;
  }
  return false;
}

/**
 * Check if a trimmed line is an HTTP method decorator.
 * Returns the method name or null. Case-insensitive for
 * TypeScript PascalCase decorators (@Get, @Post, etc.).
 */
function getHttpMethod(line) {
  for (const method of HTTP_METHODS) {
    const regex = new RegExp('@' + method + '\\(', 'i');
    if (line.match(regex)) {
      return method;
    }
  }
  return null;
}

/**
 * Extract handler name from a method declaration line.
 */
function extractHandlerName(line) {
  const match = line.match(/^(?:async\s+)?(\w+)\s*\(/);
  return match ? match[1] : null;
}

/**
 * Scan a controller file and return:
 * 1. classPublicRoutes: handlers found in files with class-level @Public()
 * 2. methodPublicRoutes: handlers with method-level @Public()
 */
function scanFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { classLevel: false, classMethodHandlers: [], methodRoutes: [] };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = path.relative(path.resolve(__dirname, '..'), filePath).replace(/\\/g, '/');

  let hasClassLevelPublic = false;
  const classMethodHandlers = [];
  const methodRoutes = [];

  let inComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.includes('/*')) inComment = true;
    if (inComment && line.includes('*/')) { inComment = false; continue; }
    if (inComment || line.startsWith('//') || line.startsWith('*')) continue;

    if (line.includes('@Public()')) {
      if (isClassLevelPublic(lines, i)) {
        hasClassLevelPublic = true;
      } else {
        // Method-level @Public(): find the next method decorator + handler
        let methodDecorator = '';
        let handlerName = null;
        for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (!nextLine || nextLine.startsWith('//') || nextLine.startsWith('*')) continue;
          if (nextLine.startsWith('@')) {
            const httpMethod = getHttpMethod(nextLine);
            if (httpMethod) {
              methodDecorator = httpMethod;
            }
            continue;
          }
          handlerName = extractHandlerName(nextLine);
          break;
        }

        methodRoutes.push({
          file: relativePath,
          line: i + 1,
          handler: handlerName || 'unknown',
          method: methodDecorator || 'unknown',
        });
      }
    }
  }

  // If class-level @Public(), collect all method handlers in this class
  if (hasClassLevelPublic) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('@')) {
        const httpMethod = getHttpMethod(line);
        if (httpMethod) {
          for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
            const nextLine = lines[j].trim();
            const handlerName = extractHandlerName(nextLine);
            if (handlerName) {
              classMethodHandlers.push({
                file: relativePath,
                handler: handlerName,
                method: httpMethod,
              });
              break;
            }
          }
        }
      }
    }
  }

  return {
    classLevel: hasClassLevelPublic,
    classMethodHandlers,
    methodRoutes,
  };
}

// ---- Main ----

console.log('=== Public Route Exposure Verifier ===\n');

// 1. Find all controller files
const controllerFiles = findControllerFiles(BACKEND_SRC);
console.log('Found ' + controllerFiles.length + ' controller files.');

// 2. Scan each file
const allMethodRoutes = [];
const allClassHandlers = [];

for (const file of controllerFiles) {
  const result = scanFile(file);
  allMethodRoutes.push(...result.methodRoutes);
  if (result.classLevel) {
    allClassHandlers.push(...result.classMethodHandlers);
  }
}

console.log('Method-level @Public() found: ' + allMethodRoutes.length);
console.log('Class-level @Public() handlers found: ' + allClassHandlers.length + '\n');

// 3. Check method-level @Public() routes against allowlist
for (const route of allMethodRoutes) {
  const key = route.file + ':' + route.handler;
  const match = allowlistMap.get(key);

  if (!match) {
    errors.push(
      'FAIL: Unknown method-level public route:\n' +
      '       File: ' + route.file + ':' + route.line + '\n' +
      '       Handler: ' + route.handler + '\n' +
      '       Method: ' + route.method + '\n' +
      '       Add this route to ' + ALLOWLIST_PATH + ' or remove @Public() if not intended.'
    );
    exitCode = 1;
    continue;
  }

  if (route.method !== 'unknown' && match.method !== route.method) {
    warnings.push(
      'WARN: Method mismatch for ' + key + ':\n' +
      '       Allowlist: ' + match.method + ', Found: ' + route.method
    );
  }
}

// 4. Check class-level @Public() handlers against allowlist
for (const handler of allClassHandlers) {
  const key = handler.file + ':' + handler.handler;
  const match = allowlistMap.get(key);

  if (!match) {
    errors.push(
      'FAIL: Unknown public route (class-level @Public()):\n' +
      '       File: ' + handler.file + '\n' +
      '       Handler: ' + handler.handler + '\n' +
      '       Method: ' + handler.method + '\n' +
      '       Add this route to ' + ALLOWLIST_PATH + ' or remove class-level @Public() if not intended.'
    );
    exitCode = 1;
    continue;
  }

  if (match.method !== handler.method) {
    warnings.push(
      'WARN: Method mismatch for ' + key + ':\n' +
      '       Allowlist: ' + match.method + ', Found: ' + handler.method
    );
  }
}

// 5. Verify allowlist entries reference existing files and handlers
for (const entry of allowlist) {
  const filePath = path.resolve(__dirname, '..', entry.file);
  if (!fs.existsSync(filePath)) {
    errors.push('FAIL: Allowlist references missing file: ' + entry.file + ' (handler: ' + entry.handler + ')');
    exitCode = 1;
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const handlerPattern = new RegExp('(?:async\\s+)?' + entry.handler + '\\s*\\(');
  if (!handlerPattern.test(content)) {
    errors.push('FAIL: Allowlist references missing handler \'' + entry.handler + '\' in ' + entry.file);
    exitCode = 1;
  }
}

// 6. Report coverage
const foundKeys = new Set();
for (const r of allMethodRoutes) {
  foundKeys.add(r.file + ':' + r.handler);
}
for (const h of allClassHandlers) {
  foundKeys.add(h.file + ':' + h.handler);
}

const missingFromCode = [];
for (const entry of allowlist) {
  const key = entry.file + ':' + entry.handler;
  if (!foundKeys.has(key)) {
    missingFromCode.push(key);
  }
}

if (missingFromCode.length > 0) {
  warnings.push('Allowlist entries not matched to scanned code:');
  for (const key of missingFromCode) {
    warnings.push('       ' + key);
  }
  warnings.push('       File may not be scanned or handler may have been renamed/removed.');
}

// Results
printResults();

function printResults() {
  if (errors.length > 0) {
    console.log('--- ERRORS ---');
    for (const e of errors) console.log(e);
  }

  if (warnings.length > 0) {
    console.log('\n--- WARNINGS ---');
    for (const w of warnings) console.log(w);
  }

  console.log('\n--- SUMMARY ---');
  console.log('Errors:                    ' + errors.length);
  console.log('Warnings:                  ' + warnings.length);
  console.log('Allowlist entries:         ' + allowlist.length);
  console.log('Method-level public found: ' + allMethodRoutes.length);
  console.log('Class-level handlers found: ' + allClassHandlers.length);
  const totalFound = allMethodRoutes.length + allClassHandlers.length;
  console.log('Coverage:                  ' + totalFound + '/' + allowlist.length + ' allowlist entries matched');

  if (exitCode === 0) {
    console.log('\nRESULT: PASS - All public routes are allowlisted.');
  } else {
    console.log('\nRESULT: FAIL - See errors above.');
  }
}

process.exit(exitCode);
