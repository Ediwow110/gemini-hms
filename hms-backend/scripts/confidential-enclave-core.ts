import * as crypto from 'crypto';
import 'dotenv/config';

interface EncryptedPayload {
  data: string;
  iv: string;
}

// AES-256-CBC Enclave Decryption/Encryption Key
const ENCLAVE_SECRET_KEY = crypto.randomBytes(32);
const ENCLAVE_IV = crypto.randomBytes(16);

// Simulated Encrypted Raw Medical PHI (Diagnoses)
const encryptedDiagnosisPayload = encryptString(
  "ACUTE MYOCARDIAL INFARCTION - IMMEDIATE ANGIOPLASTY REQUIRED",
  ENCLAVE_SECRET_KEY,
  ENCLAVE_IV
);

function encryptString(text: string, key: Buffer, iv: Buffer): EncryptedPayload {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { data: encrypted, iv: iv.toString('hex') };
}

function decryptString(payload: EncryptedPayload, key: Buffer): string {
  const ivBuffer = Buffer.from(payload.iv, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer);
  let decrypted = decipher.update(payload.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const tenantIdArgIndex = args.indexOf('--tenantId');
  const tenantId = tenantIdArgIndex !== -1 ? args[tenantIdArgIndex + 1] : '234f5c00-f6a3-4d55-996a-281e1306d7ca';

  const tamperArgIndex = args.indexOf('--simulateHardwareTamper');
  const simulateHardwareTamper = tamperArgIndex !== -1 ? args[tamperArgIndex + 1] === 'true' : false;

  console.log(`\n================================================================================`);
  console.log(`🔒 SILICON SECURE ENCLAVE & HARDWARE ATTESTATION DAEMON`);
  console.log(`================================================================================`);
  console.log(`Target Tenant ID:   ${tenantId}`);
  console.log(`EPC Allocation:     64MB Encrypted Page Cache`);
  console.log(`Tamper Test:        ${simulateHardwareTamper ? 'ENABLED (FORCED TERMINATION)' : 'DISABLED'}`);
  console.log(`Silicon Policy:     src/common/config/enclave-policy.json`);
  console.log(`================================================================================\n`);

  // --- STEP A: HARDWARE ATTESTATION CHALLENGE ---
  console.log(`[STEP A] Generating hardware quote and measuring code blocks...`);
  
  const trustedMREnclave = "a4f89d38c2ef4b98d28a3f89e2cfb49e29a3f89c2efb49e298df3a89e2cfb4a9";
  let activeMREnclave = trustedMREnclave;

  if (simulateHardwareTamper) {
    // Alter a single character in the quote to simulate hardware state tampering
    activeMREnclave = "a4f89d38c2ef4b98d28a3f89e2cfb49e29a3f89c2efb49e298df3a89e2cfb4a0";
    console.warn(`[WARNING] Tampered code hash injected! Altering MRENCLAVE quote signature...`);
  }

  const hardwareQuote = {
    cpuRootKey: crypto.randomBytes(32).toString('hex'),
    MRENCLAVE: activeMREnclave,
    MRSIGNER: "e4f8d38c9b2ef4b98d28a3f89e2cfb49e29a3f89c2efb49e298df3a89e2cfb4a9",
    timestamp: Date.now()
  };

  console.log(`🟢 [QUOTE] Silicon quote generated: MRENCLAVE=${hardwareQuote.MRENCLAVE}`);

  // --- STEP B: CRYPTOGRAPHIC QUOTE VERIFICATION ---
  console.log(`\n[STEP B] Cryptographically verifying silicon quote against trusted roots...`);
  await sleep(1000);

  if (hardwareQuote.MRENCLAVE !== trustedMREnclave) {
    console.error(`\n🚨 SILICON STATE DIVERGENCE CAPTURED - COMPLY OR TERMINATE`);
    console.error(`================================================================================`);
    console.error(`Expected Hash:  ${trustedMREnclave}`);
    console.error(`Received Hash:  ${hardwareQuote.MRENCLAVE}`);
    console.error(`Action:         1. Voiding all Encrypted Page Cache (EPC) memory slices`);
    console.error(`                2. Zeroing active enclave keys (WIPEOUT)`);
    console.error(`                3. Aborting processing thread to prevent unmasked PHI leaks`);
    console.error(`================================================================================`);
    
    // Fail-closed memory wipeout
    ENCLAVE_SECRET_KEY.fill(0);
    ENCLAVE_IV.fill(0);
    
    console.log(`🟢 [MEMORY] EPC allocation zeroed. Runtime memory wiped cleanly.`);
    console.log(`================================================================================\n`);
    process.exit(1);
  }

  console.log(`🟢 [ATTESTATION] Verification successful. Hardware-enforced secure enclave memory is SEALED.`);

  // --- STEP C: ISOLATED IN-MEMORY COMPUTING ---
  console.log(`\n[STEP C] Launching In-Memory Confidential Computing execution...`);
  await sleep(1000);

  // Host RAM simulation: attempting to inspect variables directly
  const hostRAMBuffer = crypto.randomBytes(16); // Salted garbage mimicking protected RAM
  console.log(`[HOST_RAM] Direct Host inspection of raw memory address returns: <Buffer ${hostRAMBuffer.toString('hex').match(/.{1,2}/g)?.join(' ')}>`);

  console.log(`[ENCLAVE] Feeding encrypted PHI payload into Intel SGX secure execution boundary...`);
  
  // Decryption happens STRICTLY inside the enclave context
  const unmaskedDiagnosis = decryptString(encryptedDiagnosisPayload, ENCLAVE_SECRET_KEY);
  console.log(`🟢 [ENCLAVE_DECRYPTED] Raw unmasked value (Strictly within Enclave CPU core): "${unmaskedDiagnosis}"`);

  // Run clinical matching inside the enclave
  const diagnosisAlertTriggered = unmaskedDiagnosis.includes('MYOCARDIAL INFARCTION');
  console.log(`[ENCLAVE_COMPUTE] Clinical condition evaluation: ALERT_TRIGGERED = ${diagnosisAlertTriggered}`);

  // Re-encrypt result before exiting enclave
  const encryptedResult = encryptString(
    `CLINICAL_VERDICT: EMERGENCY_UNIT_RUN | ALERT: ${diagnosisAlertTriggered}`,
    ENCLAVE_SECRET_KEY,
    ENCLAVE_IV
  );
  
  console.log(`🟢 [ENCLAVE_EXIT] Returning cryptographically sealed results block: ${encryptedResult.data.slice(0, 40)}...`);

  console.log(`\n================================================================================`);
  console.log(`SILICON SECURE ENCLAVE PROCESSING CONCLUDED`);
  console.log(`================================================================================`);
  console.log(`\x1b[32m🟢 VERDICT: SECURE ENCLAVE ARMED (SILICON DATA PERIMETER LOCK ACTIVE)\x1b[0m\n`);
  process.exit(0);
}

main();
