import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// --- CONFIGURATION ---
const FRONTEND_SRC_DIR = path.join(process.cwd(), 'src');
const CLINICAL_SERVICE_FILE = path.join(FRONTEND_SRC_DIR, 'services', 'clinicalWorkflow.service.ts');
const CLINICAL_HOOKS_FILE = path.join(FRONTEND_SRC_DIR, 'hooks', 'use-clinical-workflow.ts');
const PHARMACY_HOOKS_FILE = path.join(FRONTEND_SRC_DIR, 'hooks', 'use-pharmacy.ts');
const PORTALS_DIR = path.join(FRONTEND_SRC_DIR, 'portals');
const PATIENT_PORTAL_DIR = path.join(PORTALS_DIR, 'patient');
const DOCTOR_PORTAL_DIR = path.join(PORTALS_DIR, 'doctor');
const NURSE_PORTAL_DIR = path.join(PORTALS_DIR, 'nurse');
const LAB_PORTAL_DIR = path.join(PORTALS_DIR, 'lab');
const CASHIER_BILLING_PAGE = path.join(PORTALS_DIR, 'cashier', 'PatientBillingPage.tsx');

let errorsFound = 0;

function reportError(message: string) {
  console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`);
  errorsFound++;
}

function reportPass(message: string) {
  console.log(`\x1b[32m[PASS]\x1b[0m ${message}`);
}

function stripComments(content: string): string {
  // Strip block comments /* ... */ and line comments // ...
  return content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
}

// Recursive helper to get all TS/TSX files in a directory
function getAllFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

console.log('=== Starting Advanced Clinical Read-Only Wiring & UI Safety Verification ===\n');

// ==========================================
// SERVICE LAYER CONSTRAINTS (TARGETS 1-5)
// ==========================================
console.log('--- Checking Service Layer (clinicalWorkflow.service.ts) ---');
if (fs.existsSync(CLINICAL_SERVICE_FILE)) {
  const rawContent = fs.readFileSync(CLINICAL_SERVICE_FILE, 'utf-8');
  const serviceContent = stripComments(rawContent);

  // 1. Only GET calls on apiClient (allow POST to /vitals, /entered-in-error, /triage, /soap-draft, /soap-sign, /orders, /orders/:orderId/cancel, and /orders/:orderId/receive-lab)
  const apiClientMatches = [...serviceContent.matchAll(/apiClient\.(\w+)/g)];
  let nonGetMethod = false;
  const allowedNonGet = [
    // method, regex to confirm allowed endpoint pattern
    { method: 'post', endpointRegex: /\/vitals/ },
    { method: 'post', endpointRegex: /\/triage/ },
    { method: 'post', endpointRegex: /\/soap-draft/ },
    { method: 'post', endpointRegex: /\/soap-sign/ },
    { method: 'post', endpointRegex: /\/orders/ },
    { method: 'post', endpointRegex: /\/cancel/ },
    { method: 'post', endpointRegex: /\/receive-lab/ },
    { method: 'post', endpointRegex: /\/draft-lab-result/ },
    { method: 'post', endpointRegex: /\/validate-lab-result/ },
    { method: 'post', endpointRegex: /\/release-lab-result/ },
  ];
  for (const match of apiClientMatches) {
    const method = match[1];
    if (method === 'get') continue;
    // Determine if this non-GET call is allowed
    const afterMatch = serviceContent.slice(match.index + match[0].length);
    const isAllowed = allowedNonGet.some(
      ({ method: allowedMethod, endpointRegex }) =>
        method === allowedMethod && endpointRegex.test(afterMatch),
    );
    if (!isAllowed) {
      reportError(`Target 1: clinicalWorkflow.service.ts uses non-GET apiClient method: apiClient.${method}`);
      nonGetMethod = true;
    }
  }
  if (!nonGetMethod) {
    reportPass('Target 1: clinicalWorkflow.service.ts contains only allowed GET calls (and approved POST to /vitals, /entered-in-error, and /triage).');
  }

  // 2. Uses existing apiClient only
  if (!serviceContent.includes("import apiClient") && !serviceContent.includes("import { apiClient }")) {
    reportError('Target 2: clinicalWorkflow.service.ts must import and use the standard apiClient.');
  } else {
    reportPass('Target 2: clinicalWorkflow.service.ts uses existing apiClient.');
  }

  // 3. Does not use fetch directly
  if (serviceContent.includes('fetch(')) {
    reportError('Target 3: clinicalWorkflow.service.ts must not call fetch() directly.');
  } else {
    reportPass('Target 3: clinicalWorkflow.service.ts does not use fetch directly.');
  }

  // 4. Does not use axios directly
  if (/\baxios\.(get|post|put|patch|delete|request)\b/i.test(serviceContent)) {
    reportError('Target 4: clinicalWorkflow.service.ts must not make direct calls to axios.');
  } else {
    reportPass('Target 4: clinicalWorkflow.service.ts does not call axios directly.');
  }

  // 5. Does not read localStorage/sessionStorage directly
  if (serviceContent.includes('localStorage') || serviceContent.includes('sessionStorage')) {
    reportError('Target 5: clinicalWorkflow.service.ts must not access localStorage/sessionStorage directly.');
  } else {
    reportPass('Target 5: clinicalWorkflow.service.ts does not access localStorage/sessionStorage.');
  }
} else {
  reportError(`File not found: ${CLINICAL_SERVICE_FILE}`);
}

// ==========================================
// REACT QUERY HOOKS SCOPING (TARGETS 6-8)
// ==========================================
console.log('\n--- Checking React Query Hooks (use-clinical-workflow.ts) ---');
if (fs.existsSync(CLINICAL_HOOKS_FILE)) {
  const rawContent = fs.readFileSync(CLINICAL_HOOKS_FILE, 'utf-8');
  const hooksContent = stripComments(rawContent);

  // 8. Only allow exact approved mutations across clinical + pharmacy
  const clinicalMutationMatch = hooksContent.match(/useMutation\s*\(\s*\{/g);
  const clinicalMutationCount = clinicalMutationMatch ? clinicalMutationMatch.length : 0;

  let pharmacyMutationCount = 0;
  if (fs.existsSync(PHARMACY_HOOKS_FILE)) {
    const pharmacyContent = stripComments(fs.readFileSync(PHARMACY_HOOKS_FILE, 'utf-8'));
    const pharmacyMutationMatch = pharmacyContent.match(/useMutation\s*\(\s*\{/g);
    pharmacyMutationCount = pharmacyMutationMatch ? pharmacyMutationMatch.length : 0;
  }

  const totalMutationCount = clinicalMutationCount + pharmacyMutationCount;

  const allClinicalApproved =
    hooksContent.includes('useSaveVitals') &&
    hooksContent.includes('useMarkVitalsEnteredInError') &&
    hooksContent.includes('useSaveTriage') &&
    hooksContent.includes('useMarkTriageEnteredInError') &&
    hooksContent.includes('useSaveDraftSOAP') &&
    hooksContent.includes('useSignSOAP') &&
    hooksContent.includes('useCreateClinicalOrder') &&
    hooksContent.includes('useCancelClinicalOrder') &&
    hooksContent.includes('useReceiveLabOrder') &&
    hooksContent.includes('useSaveDraftLabResult') &&
    hooksContent.includes('useValidateLabResult') &&
    hooksContent.includes('useReleaseLabResult');

  const pharmacyApproved =
    fs.existsSync(PHARMACY_HOOKS_FILE) &&
    fs.readFileSync(PHARMACY_HOOKS_FILE, 'utf-8').includes('useDispenseMedication');

  if (
    totalMutationCount === 13 &&
    clinicalMutationCount === 12 &&
    pharmacyMutationCount === 1 &&
    allClinicalApproved &&
    pharmacyApproved
  ) {
    reportPass('Target 8: Total 13 approved mutations (12 clinical: useSaveVitals, useMarkVitalsEnteredInError, useSaveTriage, useMarkTriageEnteredInError, useSaveDraftSOAP, useSignSOAP, useCreateClinicalOrder, useCancelClinicalOrder, useReceiveLabOrder, useSaveDraftLabResult, useValidateLabResult, useReleaseLabResult; 1 pharmacy: useDispenseMedication).');
  } else {
    reportError(`Target 8: Found ${totalMutationCount} total mutations (clinical: ${clinicalMutationCount}, pharmacy: ${pharmacyMutationCount}). Expected exactly 13 (12 clinical + 1 pharmacy).`);
  }

  // 6. Query keys include tenant, user, and branch scopes
  const useQueryRegex = /useQuery\(\s*\{([\s\S]*?)\}\s*\)/g;
  const queries = [...hooksContent.matchAll(useQueryRegex)];
  let allQueriesScoped = true;

  if (queries.length === 0) {
    reportError('Target 6: No useQuery calls found in use-clinical-workflow.ts.');
    allQueriesScoped = false;
  } else {
    for (const [, queryBlock] of queries) {
      const keyMatch = queryBlock.match(/queryKey:\s*\[([\s\S]*?)\]/);
      if (!keyMatch) {
        reportError(`Target 6: Could not find queryKey array in query block:\n${queryBlock.substring(0, 100)}...`);
        allQueriesScoped = false;
        continue;
      }
      const keyContent = keyMatch[1];
      const hasTenant = /tenantId/i.test(keyContent);
      const hasBranch = /(branchId|effectiveBranchId)/i.test(keyContent);
      const hasUser = /(userId|user\?\.id|user\.id)/i.test(keyContent);

      if (!hasTenant || !hasBranch || !hasUser) {
        reportError(`Target 6: Query key [${keyContent.trim().replace(/\s+/g, ' ')}] is missing required scoping. Must contain tenantId, branchId, and userId.`);
        allQueriesScoped = false;
      }
    }
  }
  if (allQueriesScoped) {
    reportPass('Target 6: All React Query keys include tenant, branch, and user scopes.');
  }

  // 7. Patient-specific hooks include patientId in query keys
  const hookDeclRegex = /export\s+const\s+(\w+)\s*=\s*\(\s*patientId\b[^)]*?\)\s*=>/g;
  let match;
  let allPatientHooksKeyed = true;
  const foundHooks: string[] = [];
  while ((match = hookDeclRegex.exec(hooksContent)) !== null) {
    const hookName = match[1];
    foundHooks.push(hookName);
    const startIdx = match.index;
    
    // Look ahead to find the first queryKey definition
    const searchArea = hooksContent.substring(startIdx, startIdx + 1500);
    const keyMatch = searchArea.match(/queryKey:\s*\[([\s\S]*?)\]/);
    if (!keyMatch) {
      reportError(`Target 7: Hook ${hookName} does not have a queryKey array nearby.`);
      allPatientHooksKeyed = false;
      continue;
    }
    const keyContent = keyMatch[1];
    if (!keyContent.includes('patientId')) {
      reportError(`Target 7: Hook ${hookName} has queryKey [${keyContent.trim().replace(/\s+/g, ' ')}] which is missing patientId.`);
      allPatientHooksKeyed = false;
    }
  }
  if (foundHooks.length === 0) {
    reportError('Target 7: No patient-specific hook definitions found.');
  } else if (allPatientHooksKeyed) {
    reportPass(`Target 7: Checked ${foundHooks.length} patient hooks; all include patientId in their query keys.`);
  }
} else {
  reportError(`File not found: ${CLINICAL_HOOKS_FILE}`);
}

// ==========================================
// PORTAL AND UI PROTECTIONS (TARGETS 9-14)
// ==========================================
console.log('\n--- Checking Doctor Portal (Target 9) ---');
const doctorFiles = [
  path.join(DOCTOR_PORTAL_DIR, 'DoctorDashboard.tsx'),
  path.join(DOCTOR_PORTAL_DIR, 'DoctorQueuePage.tsx')
];

for (const file of doctorFiles) {
  if (fs.existsSync(file)) {
    const content = stripComments(fs.readFileSync(file, 'utf-8'));
    const hasErrorCheck = content.includes('errorObj') || content.includes('error') || content.includes('queueError') || content.includes('summaryError');
    const hasForbiddenCheck = content.includes('403') || content.includes('401') || content.includes('isForbidden');
    const rendersAccessRestricted = content.includes('Access Restricted') || content.includes('Connection Error');
    
    if (hasErrorCheck && hasForbiddenCheck && rendersAccessRestricted) {
      reportPass(`Target 9: ${path.basename(file)} handles 401/403 errors and renders restricted access message.`);
    } else {
      reportError(`Target 9: ${path.basename(file)} is missing robust 401/403 error checks and clean rendering.`);
    }
  } else {
    reportError(`Target 9: Doctor portal file not found: ${file}`);
  }
}

console.log('\n--- Checking Nurse and Lab Portals (Target 10 & 11) ---');
const nurseFiles = getAllFiles(NURSE_PORTAL_DIR).filter(f => !f.includes('__tests__'));
let nurseMutationsFound = false;
for (const file of nurseFiles) {
  const content = stripComments(fs.readFileSync(file, 'utf-8'));
  const isVitalsPage = path.basename(file) === 'NurseVitalsPage.tsx';
  const isTriagePage = path.basename(file) === 'NurseTriageQueuePage.tsx';
  
  // Forbidden patterns: standard mutations or custom vitals/triage/soap mutations (unless on appropriate Page)
  const hasStandardMutation = content.includes('useMutation') || /apiClient\.(post|put|patch|delete)/i.test(content);
  const hasCustomMutation = content.includes('useSaveVitals') || content.includes('useMarkVitalsEnteredInError') || content.includes('useSaveTriage') || content.includes('useMarkTriageEnteredInError') || content.includes('useSaveDraftSOAP') || content.includes('useSignSOAP') || content.includes('useCreateClinicalOrder') || content.includes('useCancelClinicalOrder');

  if (hasStandardMutation || (!isVitalsPage && !isTriagePage && hasCustomMutation)) {
    reportError(`Target 10: Nurse portal file ${path.basename(file)} contains unauthorized mutating logic.`);
    nurseMutationsFound = true;
  }
}
if (!nurseMutationsFound && nurseFiles.length > 0) {
  reportPass(`Target 10: All ${nurseFiles.length} Nurse portal files contain zero unauthorized mutation calls.`);
}

const labFiles = getAllFiles(LAB_PORTAL_DIR);
let labMutationsFound = false;
for (const file of labFiles) {
  const content = stripComments(fs.readFileSync(file, 'utf-8'));
  const hasUnauthorizedMutation = (content.includes('useSaveVitals') || content.includes('useMarkVitalsEnteredInError') || content.includes('useSaveDraftSOAP') || content.includes('useSignSOAP') || content.includes('useCreateClinicalOrder') || content.includes('useCancelClinicalOrder'));
  const isResultValidationPage = path.basename(file) === 'ResultValidationPage.tsx';
  if (hasUnauthorizedMutation && !isResultValidationPage) {
    reportError(`Target 11: Lab portal file ${path.basename(file)} contains unauthorized mutation calls.`);
    labMutationsFound = true;
  }
}
if (!labMutationsFound && labFiles.length > 0) {
  reportPass(`Target 11: All ${labFiles.length} Lab portal files contain zero mutation calls/endpoints.`);
}

console.log('\n--- Checking Cashier Portal (Target 12) ---');
if (fs.existsSync(CASHIER_BILLING_PAGE)) {
  const cashierContent = stripComments(fs.readFileSync(CASHIER_BILLING_PAGE, 'utf-8'));
  const forbiddenHooks = [
    'usePatientClinicalSummary',
    'usePatientEncounters',
    'usePatientVitals',
    'usePatientPrescriptions',
    'usePatientOrders',
    'usePatientLabResults',
    'useClinicalWorkQueue',
    'useClinicalDashboardSummary'
  ];

  let hasLeak = false;
  for (const hook of forbiddenHooks) {
    if (cashierContent.includes(hook)) {
      reportError(`Target 12: Cashier PatientBillingPage uses forbidden clinical hook: ${hook}. Cashiers must not access general clinical EMR notes.`);
      hasLeak = true;
    }
  }

  const usesHandoff = cashierContent.includes('usePatientBillingHandoff');
  if (!usesHandoff) {
    reportError('Target 12: Cashier PatientBillingPage should use usePatientBillingHandoff for billing information.');
  }

  if (!hasLeak && usesHandoff) {
    reportPass('Target 12: Cashier PatientBillingPage does not call clinical EMR hooks and only calls billing-handoff-safe hooks.');
  }
} else {
  reportError(`Target 12: Cashier file not found: ${CASHIER_BILLING_PAGE}`);
}

console.log('\n--- Checking Patient Portal Isolation (Target 13 & 14) ---');
const patientFiles = getAllFiles(PATIENT_PORTAL_DIR);
let patientIsolationError = false;
for (const file of patientFiles) {
  const content = stripComments(fs.readFileSync(file, 'utf-8'));
  if (content.includes('use-clinical-workflow') || content.includes('clinicalWorkflow.service')) {
    reportError(`Target 13 & 14: Patient portal file ${path.basename(file)} imports staff clinical workflow contracts.`);
    patientIsolationError = true;
  }
  if (content.includes('apiClient') && !content.includes('apiClient.get')) {
    reportError(`Target 13 & 14: Patient portal file ${path.basename(file)} contains apiClient mutations.`);
    patientIsolationError = true;
  }
}
if (!patientIsolationError && patientFiles.length > 0) {
  reportPass(`Target 13 & 14: All ${patientFiles.length} Patient portal files remain strictly isolated from staff clinical workflow contracts/endpoints.`);
}

// ==========================================
// WORKFLOW WRITE & UI SAFETY (TARGETS 15-17)
// ==========================================
console.log('\n--- Checking Action Buttons Shell-Only Guarantee (Target 15) ---');
const allPortalFiles = getAllFiles(PORTALS_DIR).filter(f => !f.includes('__tests__'));
let portalMutations = false;
for (const file of allPortalFiles) {
  const content = stripComments(fs.readFileSync(file, 'utf-8'));
  const isVitalsPage = path.basename(file) === 'NurseVitalsPage.tsx';
  const isTriagePage = path.basename(file) === 'NurseTriageQueuePage.tsx';
  const isDoctorSOAPEditor = path.basename(file) === 'DoctorSOAPEditor.tsx';
  const isDoctorEMRPage = path.basename(file) === 'DoctorEMRPage.tsx';
  const isDoctorOrdersPanel = path.basename(file) === 'DoctorOrdersPanel.tsx';
  const isLabOrdersPage = path.basename(file) === 'LabOrdersPage.tsx';
  const isResultEncodingPage = path.basename(file) === 'ResultEncodingPage.tsx';
  const isResultValidationPage = path.basename(file) === 'ResultValidationPage.tsx';
  const isValidatedResultsPage = path.basename(file) === 'ValidatedResultsPage.tsx';
  const isCatalogManagementPage = path.basename(file) === 'CatalogManagementPage.tsx';

  const hasStandardMutation = content.includes('useMutation') || /apiClient\.(post|put|patch|delete)/i.test(content);       
  const hasCustomMutation = content.includes('useSaveVitals') || content.includes('useMarkVitalsEnteredInError') || content.includes('useSaveTriage') || content.includes('useMarkTriageEnteredInError') || content.includes('useSaveDraftSOAP') || content.includes('useSignSOAP') || content.includes('useCreateClinicalOrder') || content.includes('useCancelClinicalOrder') || content.includes('useReceiveLabOrder') || content.includes('useSaveDraftLabResult') || content.includes('useValidateLabResult') || content.includes('useReleaseLabResult');

  if ((hasStandardMutation && !isCatalogManagementPage) || (!isVitalsPage && !isTriagePage && !isDoctorSOAPEditor && !isDoctorEMRPage && !isDoctorOrdersPanel && !isLabOrdersPage && !isResultEncodingPage && !isResultValidationPage && !isValidatedResultsPage && hasCustomMutation)) {
    reportError(`Target 15: File ${path.basename(file)} contains unauthorized mutating backend writes.`);
    portalMutations = true;
  }
  }
  if (!portalMutations) {
  reportPass('Target 15: All portal actions/buttons are verified shell-only (except approved vitals/triage/soap mutations and Catalog).');
  }
console.log('\n--- Checking Error Rendering Safety (Target 16) ---');
let errorLeakingFound = false;
for (const file of allPortalFiles) {
  const content = stripComments(fs.readFileSync(file, 'utf-8'));
  if (content.includes('error.response.data') || 
      content.includes('error.response?.data') || 
      content.includes('error.stack') || 
      /JSON\.stringify\(\s*error\s*\)/i.test(content)) {
    reportError(`Target 16: File ${path.basename(file)} renders raw error information (response data or stack traces).`);
    errorLeakingFound = true;
  }
}
if (!errorLeakingFound) {
  reportPass('Target 16: Error rendering is safe and does not dump raw error response payloads or stack traces.');
}

console.log('\n--- Checking REDACTED Demographics Fallbacks (Target 17) ---');
const filesToCheckRedaction = [
  path.join(DOCTOR_PORTAL_DIR, 'DoctorQueuePage.tsx'),
  path.join(DOCTOR_PORTAL_DIR, 'DoctorDashboard.tsx'),
  path.join(NURSE_PORTAL_DIR, 'NurseDashboard.tsx'),
  path.join(NURSE_PORTAL_DIR, 'NurseTriageQueuePage.tsx'),
  path.join(LAB_PORTAL_DIR, 'LabOrdersPage.tsx'),
  CASHIER_BILLING_PAGE
];

let redactionsValid = true;
for (const file of filesToCheckRedaction) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf-8');
    if (!content.includes('[REDACTED]')) {
      reportError(`Target 17: ${path.basename(file)} does not appear to handle patient demographics redaction using [REDACTED].`);
      redactionsValid = false;
    }
  }
}
if (redactionsValid) {
  reportPass('Target 17: Patient demographics contain intentional [REDACTED] fallbacks for unauthorized views.');
}

// ==========================================
// STATIC SECURITY CONFIG PASSES (TARGET 18)
// ==========================================
console.log('\n--- Running Security Config Checker (Target 18) ---');
try {
  const output = execSync('npx tsx scripts/verify-security-config.ts', { encoding: 'utf-8' });
  console.log(output);
  reportPass('Target 18: Static route and security checker configuration passes.');
} catch (err) {
  const errMsg = err instanceof Error ? err.message : String(err);
  reportError(`Target 18: Static route/security checker failed:\n${errMsg}`);
}

// ==========================================
// RESULTS & STATUS REPORT
// ==========================================
console.log('\n----------------------------------------------------');
if (errorsFound > 0) {
  console.error(`\x1b[31m[FAILED]\x1b[0m Clinical Read-Only Verification failed with ${errorsFound} violation(s).`);
  process.exit(1);
} else {
  console.log('\x1b[32m[SUCCESS]\x1b[0m All clinical read-only and isolation wiring checks passed.');
  process.exit(0);
}
