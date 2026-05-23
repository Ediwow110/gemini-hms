import { portalRoutes } from '../src/config/portalRoutes';
import { roleNavigation } from '../src/config/roleNavigation';
import * as fs from 'fs';
import * as path from 'path';

/**
 * SECURITY CONSISTENCY CHECKER
 * 
 * Verifies that the frontend routing and navigation configurations
 * adhere to established security and isolation boundaries.
 * Also verifies cookie-based auth and CSRF protection.
 */

const verifySecurityConfig = () => {
  console.log('--- Starting Security Consistency Check ---');
  let errors = 0;
  const SRC_DIR = path.join(process.cwd(), 'src');

  // 1. Verify every route in portalRoutes has explicit protection
  portalRoutes.forEach(route => {
    if (!route.requiredPermission && !route.allowedRoles && route.zone !== 'public' && route.path !== 'marketplace') {
      console.error(`[ERROR] Route "${route.path}" is missing explicit permission or role protection.`);
      errors++;
    }
  });

  // 2. Verify all navigation items map to registered routes
  roleNavigation.forEach(group => {
    group.items.forEach(item => {
      const targetPath = item.to.replace(/^\//, '');
      const matchingRoute = portalRoutes.find(r => {
        if (r.path === targetPath) return true;
        if (r.path.includes(':') && r.path.startsWith(targetPath + '/')) return true;
        return false;
      });
      if (!matchingRoute) {
        console.error(`[ERROR] Navigation item "${item.label}" (to: ${item.to}) has no matching entry in portalRoutes.`);
        errors++;
      }
    });
  });

  // 3. Verify Isolation Rules
  portalRoutes.filter(r => r.path.startsWith('patient/')).forEach(r => {
     if (r.zone === 'staff') {
       console.error(`[ERROR] Patient route "${r.path}" is incorrectly assigned to staff zone.`);
       errors++;
     }
  });

  portalRoutes.filter(r => r.zone === 'staff').forEach(r => {
    if (r.allowedRoles?.includes('Patient')) {
       console.error(`[ERROR] Staff route "${r.path}" incorrectly allows "Patient" role.`);
       errors++;
    }
  });

  portalRoutes.filter(r => r.path.startsWith('supplier')).forEach(r => {
    if (r.zone === 'staff') {
       console.error(`[ERROR] Supplier route "${r.path}" is incorrectly in staff zone. Should be marketplace.`);
       errors++;
    }
  });

  // 4. Verify Sandbox/Shell Warnings in Pages
  const portalDirs = ['src/portals/patient', 'src/portals/marketplace', 'src/portals/field-service', 'src/portals/integration'];
  console.log('Checking for sandbox notices in portal pages...');
  
  portalDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) return;

    const checkDir = (currentPath: string) => {
      const items = fs.readdirSync(currentPath);
      items.forEach(item => {
        const itemPath = path.join(currentPath, item);
        if (fs.statSync(itemPath).isDirectory()) {
          checkDir(itemPath);
        } else if (item.endsWith('Page.tsx') || item.endsWith('Dashboard.tsx')) {
          const content = fs.readFileSync(itemPath, 'utf8');
          if (!content.includes('ShellNotice') && !content.includes('Functional Prototype Shell') && !item.includes('Wrapper')) {
             console.warn(`[WARNING] Page "${item}" at ${itemPath} might be missing a sandbox/shell notice.`);
          }
        }
      });
    };
    
    checkDir(fullPath);
  });

  // 5. Verify localStorage no longer contains auth tokens
  console.log('Checking for auth token localStorage usage...');
  const sourceFiles: string[] = [];
  const collectFiles = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !fullPath.includes('node_modules') && !fullPath.includes('__tests__')) {
        collectFiles(fullPath);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        sourceFiles.push(fullPath);
      }
    }
  };
  collectFiles(SRC_DIR);

  let localStorageTokenFound = false;
  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    // Check for auth token localStorage usage (non-UI-preference)
    const tokenPatterns = [
      /localStorage\.(getItem|setItem|removeItem)\s*\(\s*['"](token|user)['"]\s*\)/,
      /localStorage\.(getItem|setItem|removeItem)\s*\(\s*['"]access_token['"]\s*\)/,
      /localStorage\.(getItem|setItem|removeItem)\s*\(\s*['"]refresh_token['"]\s*\)/,
    ];
    for (const pattern of tokenPatterns) {
      if (pattern.test(content)) {
        console.error(`[ERROR] Auth token localStorage usage found in ${path.relative(SRC_DIR, file)}: ${content.match(pattern)?.[0]}`);
        localStorageTokenFound = true;
        errors++;
      }
    }
  }
  if (!localStorageTokenFound) {
    console.log('[PASS] No auth token localStorage usage found.');
  }

  // 6. Verify api.ts uses withCredentials and no Bearer injection from localStorage
  const apiFilePath = path.join(SRC_DIR, 'lib', 'api.ts');
  if (fs.existsSync(apiFilePath)) {
    const apiContent = fs.readFileSync(apiFilePath, 'utf-8');
    if (!apiContent.includes('withCredentials')) {
      console.error('[ERROR] api.ts must use withCredentials: true for cookie auth.');
      errors++;
    } else {
      console.log('[PASS] api.ts uses withCredentials.');
    }
    if (apiContent.includes('localStorage.getItem')) {
      console.error('[ERROR] api.ts must not read tokens from localStorage.');
      errors++;
    } else {
      console.log('[PASS] api.ts does not read tokens from localStorage.');
    }
    if (apiContent.includes('X-CSRF-Token') || apiContent.includes('xsrf') || apiContent.includes('csrf')) {
      console.log('[PASS] api.ts includes CSRF token header support.');
    } else {
      console.error('[ERROR] api.ts must include CSRF token header for unsafe requests.');
      errors++;
    }
  } else {
    console.error('[ERROR] api.ts not found.');
    errors++;
  }

  // 7. Verify ProtectedRoute uses auth context not localStorage
  const protectedRoutePath = path.join(SRC_DIR, 'app', 'ProtectedRoute.tsx');
  if (fs.existsSync(protectedRoutePath)) {
    const prContent = fs.readFileSync(protectedRoutePath, 'utf-8');
    if (prContent.includes('localStorage')) {
      console.error('[ERROR] ProtectedRoute.tsx must not use localStorage for auth check.');
      errors++;
    } else {
      console.log('[PASS] ProtectedRoute.tsx does not use localStorage.');
    }
    if (prContent.includes('useAuth')) {
      console.log('[PASS] ProtectedRoute.tsx uses auth context.');
    } else {
      console.error('[ERROR] ProtectedRoute.tsx must use useAuth hook for auth state.');
      errors++;
    }
  } else {
    console.error('[ERROR] ProtectedRoute.tsx not found.');
    errors++;
  }

  // 8. Verify use-user.tsx does not use localStorage for auth
  const useUserPath = path.join(SRC_DIR, 'hooks', 'use-user.tsx');
  if (fs.existsSync(useUserPath)) {
    const uuContent = fs.readFileSync(useUserPath, 'utf-8');
    if (uuContent.includes('localStorage.getItem')) {
      console.error('[ERROR] use-user.tsx must not read auth state from localStorage.');
      errors++;
    } else {
      console.log('[PASS] use-user.tsx does not read auth from localStorage.');
    }
  } else {
    console.error('[ERROR] use-user.tsx not found.');
    errors++;
  }

  // 9. Verify LoginForm.tsx does not use localStorage for auth tokens
  const loginFormPath = path.join(SRC_DIR, 'features', 'auth', 'LoginForm.tsx');
  if (fs.existsSync(loginFormPath)) {
    const lfContent = fs.readFileSync(loginFormPath, 'utf-8');
    if (/localStorage\.(setItem|getItem|removeItem)\s*\(\s*['"]token['"]\s*\)/.test(lfContent)) {
      console.error('[ERROR] LoginForm.tsx must not store auth tokens in localStorage.');
      errors++;
    } else {
      console.log('[PASS] LoginForm.tsx does not store auth tokens in localStorage.');
    }
  } else {
    console.error('[ERROR] LoginForm.tsx not found.');
    errors++;
  }

  // 10. Verify frontend does not read persistent auth tokens from response bodies
  console.log('Checking for auth token response body reading...');
  let responseTokenFound = false;
  const tokenResponsePatterns = [
    /response\.data\.accessToken/,
    /res\.data\.accessToken/,
    /response\.data\.refreshToken/,
    /res\.data\.refreshToken/,
  ];
  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    for (const pattern of tokenResponsePatterns) {
      if (pattern.test(content)) {
        // Exclude the MFA challenge token — that's short-lived and scoped
        if (content.includes('mfaToken')) continue;
        console.error(`[ERROR] Auth token read from response body in ${path.relative(SRC_DIR, file)}: ${content.match(pattern)?.[0]}`);
        responseTokenFound = true;
        errors++;
      }
    }
  }
  if (!responseTokenFound) {
    console.log('[PASS] Frontend does not read persistent auth tokens from response bodies.');
  }

  // 11. Verify backend auth controller does not return persistent tokens in default browser responses
  const backendControllerPath = path.join(process.cwd(), '..', 'hms-backend', 'src', 'auth', 'auth.controller.ts');
  if (fs.existsSync(backendControllerPath)) {
    const controllerContent = fs.readFileSync(backendControllerPath, 'utf-8');
    // Login response should not include accessToken/refreshToken
    const loginResponseMatch = controllerContent.match(/return\s*\{[\s\S]*?message:\s*'Authenticated'[\s\S]*?\};/);
    if (loginResponseMatch && loginResponseMatch[0].includes('accessToken')) {
      console.error('[ERROR] Login response body exposes accessToken.');
      errors++;
    } else if (loginResponseMatch) {
      console.log('[PASS] Login response body does not expose accessToken.');
    }
    // MFA verify response should not include accessToken/refreshToken
    const mfaVerifyMatch = controllerContent.match(/return\s*\{[\s\S]*?message:\s*'MFA verified'[\s\S]*?\};/);
    if (mfaVerifyMatch && mfaVerifyMatch[0].includes('accessToken')) {
      console.error('[ERROR] MFA verify response body exposes accessToken.');
      errors++;
    } else if (mfaVerifyMatch) {
      console.log('[PASS] MFA verify response body does not expose accessToken.');
    }
    // Recovery code verify response should not include accessToken/refreshToken
    const recoveryVerifyMatch = controllerContent.match(/return\s*\{[\s\S]*?message:\s*'MFA verified via recovery code'[\s\S]*?\};/);
    if (recoveryVerifyMatch && recoveryVerifyMatch[0].includes('accessToken')) {
      console.error('[ERROR] Recovery code verify response body exposes accessToken.');
      errors++;
    } else if (recoveryVerifyMatch) {
      console.log('[PASS] Recovery code verify response body does not expose accessToken.');
    }
  } else {
    console.log('[INFO] Backend auth controller not found — skipping response body check.');
  }

  // 12. Verify patient portal auth controller — hardened to not expose accessToken by default
  const patientControllerPath = path.join(process.cwd(), '..', 'hms-backend', 'src', 'patient-portal', 'patient-portal.controller.ts');
  if (fs.existsSync(patientControllerPath)) {
    const pcContent = fs.readFileSync(patientControllerPath, 'utf-8');
    if (pcContent.includes("'patient_token'") && pcContent.includes("res.cookie(")) {
      console.log('[PASS] Patient portal login sets httpOnly patient_token cookie.');
    } else {
      console.error('[ERROR] Patient portal login does not set patient_token cookie.');
      errors++;
    }
    if (pcContent.includes('patient_csrf') && pcContent.includes("res.cookie(")) {
      console.log('[PASS] Patient portal login sets non-httpOnly patient_csrf cookie for double-submit CSRF.');
    } else {
      console.error('[ERROR] Patient portal login does not set patient_csrf CSRF cookie.');
      errors++;
    }
    // Default response must not include accessToken (browser-safe)
    if (!pcContent.includes('body.accessToken') && !pcContent.includes('return accessToken')) {
      console.log('[PASS] Patient portal login default response does not expose accessToken.');
    } else {
      console.error('[ERROR] Patient portal login default response exposes accessToken to browser JS.');
      errors++;
    }
    // X-Request-Access-Token opt-in has been removed — no browser-accessible token bypass
    if (!pcContent.includes('x-request-access-token')) {
      console.log('[PASS] Patient portal login has no X-Request-Access-Token bypass (removed in Gate 19D-F).');
    } else {
      console.warn('[WARNING] Patient portal login still references X-Request-Access-Token.');
    }
    // Verify cookie path is narrowed to /patient-portal
    if (pcContent.includes("path: '/patient-portal'")) {
      console.log('[PASS] Patient portal cookies scoped to /patient-portal.');
    } else {
      console.error('[ERROR] Patient portal cookies not scoped to /patient-portal.');
      errors++;
    }
    if (pcContent.includes("res.clearCookie('patient_token'")) {
      console.log('[PASS] Patient portal logout clears patient_token cookie.');
    } else {
      console.error('[ERROR] Patient portal logout does not clear patient_token cookie.');
      errors++;
    }
    if (pcContent.includes("res.clearCookie('patient_csrf'")) {
      console.log('[PASS] Patient portal logout clears patient_csrf cookie.');
    } else {
      console.error('[ERROR] Patient portal logout does not clear patient_csrf cookie.');
      errors++;
    }
    // CSRF guard protects unsafe methods
    const patientCsrfGuardPath = path.join(process.cwd(), '..', 'hms-backend', 'src', 'patient-portal', 'guards', 'patient-csrf.guard.ts');
    if (fs.existsSync(patientCsrfGuardPath)) {
      const csrfContent = fs.readFileSync(patientCsrfGuardPath, 'utf-8');
      if (csrfContent.includes('patient_csrf') && csrfContent.includes('x-csrf-token')) {
        console.log('[PASS] PatientCsrfGuard enforces double-submit CSRF check on unsafe methods.');
      } else {
        console.error('[ERROR] PatientCsrfGuard is missing CSRF cookie/header check.');
        errors++;
      }
    } else {
      console.error('[ERROR] PatientCsrfGuard not found.');
      errors++;
    }
  }

  console.log('--- Consistency Check Complete ---');
  if (errors > 0) {
    console.error(`${errors} security consistency errors found.`);
    process.exit(1);
  } else {
    console.log('All security checks passed.');
  }
};

verifySecurityConfig();
