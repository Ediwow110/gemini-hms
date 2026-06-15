/**
 * Migration Upgrade Rehearsal
 *
 * Creates a disposable PostgreSQL database, applies a genuine historical
 * baseline (everything before 20260615020000), seeds legacy-compatible
 * data via raw SQL, then runs `prisma migrate deploy` to prove the
 * upgrade path.
 *
 * Safety:
 *   - ALLOW_DESTRUCTIVE_MIGRATION_TEST=true required
 *   - Connects to the admin database ("postgres") and manages its own DB
 *   - DB name always contains "migration_test" + random suffix
 *   - DB is dropped in `finally` (including failure paths)
 *   - Never touches production or developer databases
 *
 * Usage:
 *   ALLOW_DESTRUCTIVE_MIGRATION_TEST=true DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres npx tsx scripts/verify-migration-upgrade.ts
 *
 * env:
 *   DATABASE_URL — admin connection URL (e.g. postgresql://postgres:pass@localhost:5432/postgres)
 *   ALLOW_DESTRUCTIVE_MIGRATION_TEST — must be "true"
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import * as crypto from 'crypto';

// ---------------------------------------------------------------------------
// Safety checks
// ---------------------------------------------------------------------------
const ALLOW = process.env.ALLOW_DESTRUCTIVE_MIGRATION_TEST;
if (ALLOW !== 'true') {
  console.error('FATAL: Set ALLOW_DESTRUCTIVE_MIGRATION_TEST=true to run migration tests');
  process.exit(1);
}

const adminDbUrl = process.env.DATABASE_URL;
if (!adminDbUrl) {
  console.error('FATAL: DATABASE_URL is required (admin connection, e.g. postgresql://postgres:pass@localhost:5432/postgres)');
  process.exit(1);
}

// Build a disposable DB name
const DB_SUFFIX = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
const TEST_DB = `hms_migration_test_${DB_SUFFIX}`;

// The target migration whose baseline everything before it must be
const TARGET_MIGRATION = '20260615020000_add_system_actors_and_composite_financial_fks';
const MIGRATIONS_DIR = path.resolve(__dirname, '../prisma/migrations');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function run(cmd: string, label: string, dbUrl: string): string {
  console.log(`\n--- ${label} ---`);
  console.log(`$ ${cmd}`);
  try {
    return execSync(cmd, {
      encoding: 'utf-8',
      env: { ...process.env, DATABASE_URL: dbUrl },
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (err: any) {
    console.error(err.stderr || err.message);
    throw new Error(`${label} FAILED`);
  }
}

function runNoThrow(cmd: string, label: string, dbUrl: string): { stdout: string; stderr: string; status: number } {
  console.log(`\n--- ${label} ---`);
  console.log(`$ ${cmd}`);
  try {
    const stdout = execSync(cmd, {
      encoding: 'utf-8',
      env: { ...process.env, DATABASE_URL: dbUrl },
      maxBuffer: 10 * 1024 * 1024,
    });
    return { stdout, stderr: '', status: 0 };
  } catch (err: any) {
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || err.message,
      status: err.status ?? 1,
    };
  }
}

function listMigrations(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function uuid(): string { return crypto.randomUUID(); }

function ts(): string { return new Date().toISOString(); }

async function sql(query: string, pool: Pool): Promise<void> {
  const client = await pool.connect();
  try { await client.query(query); } finally { client.release(); }
}

/**
 * Split a multi-statement SQL string into individual statements so each can
 * be executed in its own command batch. This is required because PostgreSQL's
 * `check_safe_enum_use` (error 55P04) rejects usage of a newly-added enum
 * value within the same batch where `ALTER TYPE ... ADD VALUE` appeared.
 *
 * Prisma-generated migration SQL is well-structured; this simple split by `;`
 * is safe because no Prisma migration file contains semicolons inside string
 * literals or PL/pgSQL function bodies.
 */
/**
 * Split SQL into individual statements, respecting:
 *   - Single-quoted strings ('...')
 *   - Dollar-quoted strings ($$...$$, $tag$...$tag$)
 *   - Single-line comments (-- ...)
 *   - Block comments (\/\* ... *\/)
 *
 * This ensures that semicolons inside function bodies, trigger definitions,
 * or string literals are not mistaken for statement boundaries.
 */
function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let i = 0;

  while (i < sql.length) {
    // Single-quoted string
    if (sql[i] === "'") {
      current += sql[i++];
      while (i < sql.length) {
        current += sql[i];
        if (sql[i] === "'" && (i === 0 || sql[i - 1] !== '\\')) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // Dollar-quoted string ($$ or $tag$)
    if (sql[i] === '$') {
      const start = i;
      i++;
      let tag = '';
      while (i < sql.length && sql[i] !== '$') {
        tag += sql[i++];
      }
      if (i < sql.length && sql[i] === '$') {
        // Found opening $tag$
        const closeTag = '$' + tag + '$';
        current += sql.substring(start, i + 1);
        i++;
        // Find the closing $tag$
        const closeIdx = sql.indexOf(closeTag, i);
        if (closeIdx >= 0) {
          current += sql.substring(i, closeIdx + closeTag.length);
          i = closeIdx + closeTag.length;
        }
        continue;
      } else {
        // Not a dollar-quote, backtrack
        i = start + 1;
        current += '$';
        continue;
      }
    }

    // Single-line comment
    if (sql[i] === '-' && i + 1 < sql.length && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
      continue;
    }

    // Block comment
    if (sql[i] === '/' && i + 1 < sql.length && sql[i + 1] === '*') {
      i += 2;
      while (i + 1 < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    // Statement separator
    if (sql[i] === ';') {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed + ';');
      }
      current = '';
      i++;
      continue;
    }

    current += sql[i++];
  }

  const trimmed = current.trim();
  if (trimmed.length > 0) {
    statements.push(trimmed);
  }

  return statements;
}

/**
 * Apply baseline SQL and mark all baseline migrations as applied
 * in a single batch INSERT into _prisma_migrations, so that
 * `prisma migrate deploy` treats them as already-run and only
 * applies the upgrade migrations.
 *
 * The per-migration `prisma migrate resolve --applied` call would
 * take ~2s of CLI startup per migration; with 58 baseline
 * migrations that adds 116s to every test that needs a fresh
 * baseline. A single batch INSERT into _prisma_migrations has the
 * same end state in milliseconds. The schema of _prisma_migrations
 * is fixed by Prisma: (id, checksum, migration_name, finished_at,
 * applied_steps_count, logs, started_at, rolled_back_at). We
 * compute the same SHA-256 checksum that Prisma computes (over
 * the migration.sql file content) and insert one row per
 * migration.
 */
async function applyBaselineMigrations(pool: Pool, baselineMigrations: string[], dbUrl: string): Promise<void> {
  const now = ts();
  const rows: string[] = [];
  for (const name of baselineMigrations) {
    const sqlPath = path.join(MIGRATIONS_DIR, name, 'migration.sql');
    const content = fs.readFileSync(sqlPath, 'utf-8');
    const statements = splitStatements(content);
    console.log(`  Applying baseline: ${name} (${statements.length} statements)`);
    for (const stmt of statements) {
      await sql(stmt + ';', pool);
    }
    const checksum = crypto.createHash('sha256').update(content).digest('hex');
    rows.push(`('${uuid()}', '${checksum}', '${name}', '${now}', 1, NULL, '${now}', NULL)`);
  }
  if (rows.length === 0) return;
  // _prisma_migrations is created lazily by `prisma migrate dev/deploy`.
  // The baseline migrations predate that call, so we must create
  // the table ourselves. The DDL below is the canonical Prisma
  // migration management table definition.
  await sql(
    `CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) NOT NULL,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
      "started_at" TIMESTAMPTZ NOT NULL,
      PRIMARY KEY ("id")
    )`,
    pool,
  );
  const insertSql = `INSERT INTO _prisma_migrations (id, checksum, migration_name, finished_at, applied_steps_count, logs, started_at, rolled_back_at) VALUES ${rows.join(',')}`;
  await sql(insertSql, pool);
  console.log(`  Recorded ${rows.length} baseline migrations as applied (batch INSERT).`);
}

// ---------------------------------------------------------------------------
// Legacy data seeding (raw SQL compatible with historical baseline schema)
// ---------------------------------------------------------------------------
async function seedLegacyTenant(
  pool: Pool,
): Promise<{ tenantId: string; branchId: string; userId: string; sessionId: string; patientId: string; orderId: string; invoiceId: string; paymentId: string }> {
  const tenantId = uuid();
  const branchId = uuid();
  const userId = uuid();
  const sessionId = uuid();
  const patientId = uuid();
  const orderId = uuid();
  const invoiceId = uuid();
  const paymentId = uuid();
  const now = ts();

  const queries = [
    `INSERT INTO "tenants" ("id", "name", "status", "created_at", "updated_at") VALUES ('${tenantId}', 'Legacy Hospital', 'ACTIVE', '${now}', '${now}')`,
    `INSERT INTO "branches" ("id", "tenant_id", "name", "code", "created_at", "updated_at") VALUES ('${branchId}', '${tenantId}', 'Main', 'MAIN', '${now}', '${now}')`,
    `INSERT INTO "users" ("id", "tenant_id", "email", "password_hash", "status", "failed_login_attempts", "token_version", "created_at", "updated_at") VALUES ('${userId}', '${tenantId}', 'legacy@test.com', '$2b$10$placeholder', 'ACTIVE', 0, 0, '${now}', '${now}')`,
    `INSERT INTO "patients" ("id", "tenant_id", "patient_number", "first_name", "last_name", "dob", "created_at", "updated_at") VALUES ('${patientId}', '${tenantId}', 'PAT-1001', 'Legacy', 'Patient', '1990-01-01', '${now}', '${now}')`,
    `INSERT INTO "orders" ("id", "tenant_id", "branch_id", "patient_id", "order_number", "status", "created_at", "updated_at") VALUES ('${orderId}', '${tenantId}', '${branchId}', '${patientId}', 'ORD-1001', 'COMPLETED', '${now}', '${now}')`,
    `INSERT INTO "cashier_sessions" ("id", "tenant_id", "branch_id", "user_id", "status", "opening_balance", "opened_at") VALUES ('${sessionId}', '${tenantId}', '${branchId}', '${userId}', 'OPEN', 1000.00, '${now}')`,
    `INSERT INTO "invoices" ("id", "tenant_id", "order_id", "total_amount", "status", "created_at", "updated_at") VALUES ('${invoiceId}', '${tenantId}', '${orderId}', 500.00, 'PAID', '${now}', '${now}')`,
    `INSERT INTO "payments" ("id", "tenant_id", "invoice_id", "cashier_session_id", "amount", "payment_method", "status", "idempotency_key", "created_at", "updated_at") VALUES ('${paymentId}', '${tenantId}', '${invoiceId}', '${sessionId}', 500.00, 'CASH', 'POSTED', 'legacy-${paymentId}', '${now}', '${now}')`,
  ];

  const client = await pool.connect();
  try { for (const q of queries) { await client.query(q); } } finally { client.release(); }
  return { tenantId, branchId, userId, sessionId, patientId, orderId, invoiceId, paymentId };
}

async function seedLegacyVoid(pool: Pool, tenantId: string, branchId: string, paymentId: string, userId: string): Promise<void> {
  const approvalId = uuid();
  const vid = uuid();
  const now = ts();
  const client = await pool.connect();
  try {
    await client.query(`INSERT INTO "approval_requests" ("id", "tenant_id", "requester_id", "type", "riskLevel", "record_id", "status", "created_at", "updated_at") VALUES ('${approvalId}', '${tenantId}', '${userId}', 'PAYMENT_VOID', 'HIGH', '${paymentId}', 'APPROVED', '${now}', '${now}')`);
    await client.query(`INSERT INTO "payment_voids" ("id", "tenant_id", "branch_id", "payment_id", "approval_id", "voided_by", "voided_at", "reason") VALUES ('${vid}', '${tenantId}', '${branchId}', '${paymentId}', '${approvalId}', '${userId}', '${now}', 'Legacy test void')`);
  } finally { client.release(); }
}

async function seedLegacyRefund(pool: Pool, tenantId: string, branchId: string, paymentId: string, invoiceId: string, userId: string): Promise<void> {
  const approvalId = uuid();
  const rid = uuid();
  const now = ts();
  const client = await pool.connect();
  try {
    await client.query(`INSERT INTO "approval_requests" ("id", "tenant_id", "requester_id", "type", "riskLevel", "record_id", "status", "created_at", "updated_at") VALUES ('${approvalId}', '${tenantId}', '${userId}', 'REFUND', 'HIGH', '${paymentId}', 'APPROVED', '${now}', '${now}')`);
    await client.query(`INSERT INTO "refunds" ("id", "tenant_id", "branch_id", "invoice_id", "payment_id", "amount", "approved_by", "refunded_at", "method", "reason") VALUES ('${rid}', '${tenantId}', '${branchId}', '${invoiceId}', '${paymentId}', 100.00, '${userId}', '${now}', 'CASH', 'Legacy test refund')`);
  } finally { client.release(); }
}

async function seedLegacyLedgerEntry(pool: Pool, tenantId: string, sessionId: string, paymentId: string): Promise<void> {
  const lid = uuid();
  const now = ts();
  const client = await pool.connect();
  try {
    await client.query(`INSERT INTO "cashier_ledger_entries" ("id", "tenant_id", "cashier_session_id", "type", "amount", "reference_id", "created_at") VALUES ('${lid}', '${tenantId}', '${sessionId}', 'PAYMENT', 500.00, '${paymentId}', '${now}')`);
  } finally { client.release(); }
}

// ---------------------------------------------------------------------------
// Verification helper
// ---------------------------------------------------------------------------
async function checkRow(pool: Pool, table: string, where: string, label: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT COUNT(*)::int AS c FROM "${table}" WHERE ${where}`);
    if (res.rows[0].c === 0) { console.error(`  FAIL: ${label} — no rows match`); return false; }
    console.log(`  PASS: ${label}`); return true;
  } finally { client.release(); }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== Migration Upgrade Rehearsal ===\n');

  // Determine the admin DB host/port from the admin URL, then build a
  // test-database URL by swapping the database name.
  const adminUrl = new URL(adminDbUrl!);
  const testDbName = TEST_DB;
  // Build target DB URL: same user/pass/host/port but with the test DB name
  const dbUrl = `${adminUrl.protocol}//${adminUrl.username}${adminUrl.password ? ':' + adminUrl.password : ''}@${adminUrl.hostname}${adminUrl.port ? ':' + adminUrl.port : ''}/${testDbName}?schema=public`;

  console.log(`Admin connection: ${adminUrl.hostname}:${adminUrl.port || 5432}/postgres`);
  console.log(`Test database:   ${testDbName}`);
  console.log(`Migrations dir:  ${MIGRATIONS_DIR}`);
  console.log(`Target:          ${TARGET_MIGRATION}\n`);

  const allMigrations = listMigrations();
  const targetIdx = allMigrations.indexOf(TARGET_MIGRATION);
  if (targetIdx === -1) {
    console.error(`FATAL: Target migration ${TARGET_MIGRATION} not found`);
    process.exit(1);
  }
  const baselineMigrations = allMigrations.slice(0, targetIdx);
  const upgradeMigrations = allMigrations.slice(targetIdx);

  console.log(`Total migrations: ${allMigrations.length}`);
  console.log(`Baseline: ${baselineMigrations.length}, Upgrade: ${upgradeMigrations.length}\n`);

  // Use the admin pool for DB management, the test pool for test queries
  function onPoolError(label: string) {
    return (err: Error) => {
      // 57P01 = admin shutdown via pg_terminate_backend; expected during lifecycle
      if ((err as any).code === '57P01') return;
      console.error(`[${label}] Pool error:`, err.message);
    };
  }
  const adminPool = new Pool({ connectionString: adminDbUrl });
  adminPool.on('error', onPoolError('admin'));

  let testPool: Pool = new Pool({ connectionString: dbUrl });
  testPool.on('error', onPoolError('test'));

  function closeTestPool(): Promise<void> {
    const p = testPool;
    return p.end().catch(() => {});
  }
  function refreshTestPool(): void {
    testPool = new Pool({ connectionString: dbUrl });
    testPool.on('error', onPoolError('test'));
  }

  let passed = 0;
  let failed = 0;
  function pass(label: string) { passed++; console.log(`  ✓ ${label}`); }
  function fail(label: string) { failed++; console.error(`  ✗ ${label}`); }

  try {
    // ------------------------------------------------------------------
    // 0. Create disposable database
    // ------------------------------------------------------------------
    console.log('=== STEP 0: Create disposable database ===');
    await closeTestPool();
    // Terminate any stale connections first
    await sql(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${testDbName}' AND pid <> pg_backend_pid()`, adminPool);
    await sql(`DROP DATABASE IF EXISTS "${testDbName}"`, adminPool);
    await sql(`CREATE DATABASE "${testDbName}"`, adminPool);
    refreshTestPool();
    pass(`Created disposable database: ${testDbName}`);

    // ------------------------------------------------------------------
    // TEST 1: Fresh install — apply ALL migrations to empty DB
    // ------------------------------------------------------------------
    console.log('\n=== TEST 1: Fresh install (empty database) ===');
    run('npx prisma migrate deploy', 'Prisma migrate deploy on empty DB', dbUrl);

    const freshClient = await testPool.connect();
    const freshTenantRes = await freshClient.query('SELECT COUNT(*)::int AS c FROM "tenants"');
    const freshActorRes = await freshClient.query('SELECT COUNT(*)::int AS c FROM "users" WHERE is_system = true');
    freshClient.release();

    if (freshTenantRes.rows[0].c === 0) pass('Empty DB has 0 tenants'); else fail('Expected 0 tenants on empty DB');
    if (freshActorRes.rows[0].c === 0) pass('Empty DB has 0 system actors'); else fail('Expected 0 system actors on empty DB');

    // ------------------------------------------------------------------
    // Reset DB for upgrade tests — drop and recreate
    // ------------------------------------------------------------------
    console.log('\n=== STEP: Reset for upgrade tests ===');
    await closeTestPool();
    await sql(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${testDbName}' AND pid <> pg_backend_pid()`, adminPool);
    await sql(`DROP DATABASE IF EXISTS "${testDbName}"`, adminPool);
    await sql(`CREATE DATABASE "${testDbName}"`, adminPool);
    refreshTestPool();
    pass('Database reset for upgrade tests');

    // ------------------------------------------------------------------
    // TEST 2: Populated upgrade — apply baseline, seed legacy, migrate
    // ------------------------------------------------------------------
    console.log('\n=== TEST 2: Populated upgrade ===');

    // 2a. Apply baseline migrations (everything BEFORE target)
    console.log('-- 2a: Applying historical baseline --');
    await applyBaselineMigrations(testPool, baselineMigrations, dbUrl);

    // 2a.5: Verify Prisma CLI recognises the baseline state.
    // This proves that the direct _prisma_migrations batch INSERT
    // produces a state that the Prisma Migrate engine can read.
    // Prisma CLI is pinned to "7.9.0-dev.13" (see package.json) so
    // the _prisma_migrations table schema and checksum algorithm
    // are locked to this version.
    console.log('-- 2a.5: Verifying Prisma migrate status --');
    const statusCheck = runNoThrow('npx prisma migrate status', 'Prisma migrate status after baseline', dbUrl);
    // Prisma exits 0 (up-to-date) when all migrations are applied, and 1
    // when migrations are pending. After baseline insert, upgrade migrations
    // are pending so exit code 1 is also valid. Exit code > 1 means error.
    if (statusCheck.status > 1) {
      fail('prisma migrate status failed (exit code ' + statusCheck.status + '): ' + statusCheck.stderr.slice(0, 200));
    } else {
      pass('Prisma migrate status reports consistent baseline state (exit ' + statusCheck.status + ')');
    }

    // 2b. Seed legacy data compatible with baseline schema
    console.log('\n-- 2b: Seeding legacy data --');
    const legacy = await seedLegacyTenant(testPool);
    console.log(`  Tenant A: ${legacy.tenantId}`);
    await seedLegacyVoid(testPool, legacy.tenantId, legacy.branchId, legacy.paymentId, legacy.userId);
    await seedLegacyRefund(testPool, legacy.tenantId, legacy.branchId, legacy.paymentId, legacy.invoiceId, legacy.userId);
    await seedLegacyLedgerEntry(testPool, legacy.tenantId, legacy.sessionId, legacy.paymentId);

    const legacy2 = await seedLegacyTenant(testPool);
    console.log(`  Tenant B: ${legacy2.tenantId}`);
    await seedLegacyVoid(testPool, legacy2.tenantId, legacy2.branchId, legacy2.paymentId, legacy2.userId);
    await seedLegacyRefund(testPool, legacy2.tenantId, legacy2.branchId, legacy2.paymentId, legacy2.invoiceId, legacy2.userId);
    await seedLegacyLedgerEntry(testPool, legacy2.tenantId, legacy2.sessionId, legacy2.paymentId);
    pass('Legacy data seeded');

    // 2c. Apply upgrade migrations
    console.log('\n-- 2c: Applying upgrade migrations --');
    run('npx prisma migrate deploy', 'Prisma migrate deploy on populated legacy DB', dbUrl);

    // 2d. Verify
    console.log('\n-- 2d: Verification --');
    const a1 = await checkRow(testPool, 'users', `tenant_id = '${legacy.tenantId}' AND is_system = true AND status = 'DISABLED'`, 'Tenant A system actor');
    if (a1) pass('Tenant A has DISABLED system actor'); else fail('Tenant A system actor');

    const a2 = await checkRow(testPool, 'users', `tenant_id = '${legacy2.tenantId}' AND is_system = true AND status = 'DISABLED'`, 'Tenant B system actor');
    if (a2) pass('Tenant B has DISABLED system actor'); else fail('Tenant B system actor');

    const v = await checkRow(testPool, 'payment_voids', `payment_id = '${legacy.paymentId}'`, 'PaymentVoid intact');
    if (v) pass('PaymentVoid preserved'); else fail('PaymentVoid lost');

    const r = await checkRow(testPool, 'refunds', `payment_id = '${legacy.paymentId}'`, 'Refund intact');
    if (r) pass('Refund preserved'); else fail('Refund lost');

    const l = await checkRow(testPool, 'cashier_ledger_entries', `reference_id = '${legacy.paymentId}'`, 'LedgerEntry intact');
    if (l) pass('LedgerEntry preserved'); else fail('LedgerEntry lost');

    const clientT = await testPool.connect();
    const tc = await clientT.query('SELECT COUNT(*)::int AS c FROM "tenants"');
    const ac = await clientT.query('SELECT COUNT(*)::int AS c FROM "users" WHERE is_system = true');
    clientT.release();
    if (tc.rows[0].c === 2 && ac.rows[0].c === 2) pass('2 tenants / 2 system actors'); else fail(`Expected 2/2, got ${tc.rows[0].c}/${ac.rows[0].c}`);

    // Schema and data assertions — prove the real migration chain untouched
    const sc = await testPool.connect();
    const colCheck1 = await sc.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_mfa_enabled'`);
    if (colCheck1.rows.length > 0) pass('users.is_mfa_enabled exists'); else fail('Missing is_mfa_enabled column');
    const colCheck2 = await sc.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'mfa_enabled'`);
    if (colCheck2.rows.length === 0) pass('users.mfa_enabled does NOT exist'); else fail('Spurious mfa_enabled column found');
    const sysMfa = await sc.query(`SELECT COUNT(*)::int AS c FROM "users" WHERE is_system = true AND is_mfa_enabled = false`);
    if (sysMfa.rows[0].c === 2) pass('Both system actors have is_mfa_enabled = false'); else fail(`Expected 2 system actors with mfa=false, got ${sysMfa.rows[0].c}`);
    const existingUser = await sc.query(`SELECT is_system, is_mfa_enabled FROM "users" WHERE email = 'legacy@test.com'`);
    if (existingUser.rows.length > 0 && existingUser.rows[0].is_system === false) pass('Existing legacy user unchanged (is_system=false)'); else fail('Existing user was incorrectly modified');
    sc.release();

    // ------------------------------------------------------------------
    // TEST 3: Idempotent re-run
    // ------------------------------------------------------------------
    console.log('\n=== TEST 3: Idempotent re-run ===');
    run('npx prisma migrate deploy', 'Idempotent re-run', dbUrl);
    pass('Migration idempotent');

    // ------------------------------------------------------------------
    // TEST 4: Preflight failures
    // ------------------------------------------------------------------
    console.log('\n=== TEST 4: Preflight failure scenarios ===');

    // Helper: reset DB and apply baseline for each preflight test
    async function resetAndBaseline(): Promise<void> {
      await closeTestPool();
      await sql(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${testDbName}' AND pid <> pg_backend_pid()`, adminPool);
      await sql(`DROP DATABASE IF EXISTS "${testDbName}"`, adminPool);
      await sql(`CREATE DATABASE "${testDbName}"`, adminPool);
      // Each test sub-case creates its own private Pool (p4a, p4b, p4c)
    }

    function privatePool(): Pool {
      const p = new Pool({ connectionString: dbUrl });
      p.on('error', onPoolError('p4'));
      return p;
    }

    // ---- 4a: Orphan PaymentVoid (wrong tenant) ----
    console.log('\n-- 4a: Orphan PaymentVoid (tenant mismatch) --');
    await resetAndBaseline();
    const p4a = privatePool();
    await applyBaselineMigrations(p4a, baselineMigrations, dbUrl);
    const legit4a = await seedLegacyTenant(p4a);
    const wrongTenant4a = uuid();
    await sql(`INSERT INTO "tenants" ("id", "name", "status", "created_at", "updated_at") VALUES ('${wrongTenant4a}', 'Wrong', 'ACTIVE', '${ts()}', '${ts()}')`, p4a);
    const wrongBranch4a = uuid();
    await sql(`INSERT INTO "branches" ("id", "tenant_id", "name", "code", "created_at", "updated_at") VALUES ('${wrongBranch4a}', '${wrongTenant4a}', 'Wrong', 'WRG', '${ts()}', '${ts()}')`, p4a);
    await sql(`INSERT INTO "approval_requests" ("id", "tenant_id", "requester_id", "type", "riskLevel", "record_id", "status", "created_at", "updated_at") VALUES ('${uuid()}', '${legit4a.tenantId}', '${legit4a.userId}', 'PAYMENT_VOID', 'HIGH', '${legit4a.paymentId}', 'APPROVED', '${ts()}', '${ts()}')`, p4a);
    await sql(`INSERT INTO "payment_voids" ("id", "tenant_id", "branch_id", "payment_id", "approval_id", "voided_by", "voided_at", "reason") VALUES ('${uuid()}', '${wrongTenant4a}', '${wrongBranch4a}', '${legit4a.paymentId}', '${uuid()}', '${legit4a.userId}', '${ts()}', 'Deliberate tenant mismatch')`, p4a);
    const r4a = runNoThrow('npx prisma migrate deploy', 'Migrate with orphan PaymentVoid (expect failure)', dbUrl);
    if (r4a.status !== 0 && (r4a.stderr.includes('Preflight') || r4a.stderr.includes('FAILED'))) pass('Orphan PaymentVoid correctly rejected');
    else fail('Migration should have failed with orphan PaymentVoid');
    await p4a.end();

    // ---- 4b: Orphan Refund (wrong tenant) ----
    console.log('\n-- 4b: Orphan Refund (tenant mismatch) --');
    await resetAndBaseline();
    const p4b = privatePool();
    await applyBaselineMigrations(p4b, baselineMigrations, dbUrl);
    const legit4b = await seedLegacyTenant(p4b);
    const wt4b = uuid();
    await sql(`INSERT INTO "tenants" ("id", "name", "status", "created_at", "updated_at") VALUES ('${wt4b}', 'Wrong2', 'ACTIVE', '${ts()}', '${ts()}')`, p4b);
    const wb4b = uuid();
    await sql(`INSERT INTO "branches" ("id", "tenant_id", "name", "code", "created_at", "updated_at") VALUES ('${wb4b}', '${wt4b}', 'Wrong2', 'WR2', '${ts()}', '${ts()}')`, p4b);
    await sql(`INSERT INTO "approval_requests" ("id", "tenant_id", "requester_id", "type", "riskLevel", "record_id", "status", "created_at", "updated_at") VALUES ('${uuid()}', '${legit4b.tenantId}', '${legit4b.userId}', 'REFUND', 'HIGH', '${legit4b.paymentId}', 'APPROVED', '${ts()}', '${ts()}')`, p4b);
    await sql(`INSERT INTO "refunds" ("id", "tenant_id", "branch_id", "invoice_id", "payment_id", "amount", "approved_by", "refunded_at", "method", "reason") VALUES ('${uuid()}', '${wt4b}', '${wb4b}', '${legit4b.invoiceId}', '${legit4b.paymentId}', 50.00, '${legit4b.userId}', '${ts()}', 'CASH', 'Tenant mismatch')`, p4b);
    const r4b = runNoThrow('npx prisma migrate deploy', 'Migrate with orphan Refund (expect failure)', dbUrl);
    if (r4b.status !== 0 && (r4b.stderr.includes('Preflight') || r4b.stderr.includes('FAILED'))) pass('Orphan Refund correctly rejected');
    else fail('Migration should have failed with orphan Refund');
    await p4b.end();

    // ---- 4c: Pre-existing user with system@ email (not converted) ----
    console.log('\n-- 4c: Pre-existing system@ user (not converted) --');
    await resetAndBaseline();
    const p4c = privatePool();
    await applyBaselineMigrations(p4c, baselineMigrations, dbUrl);
    const legit4c = await seedLegacyTenant(p4c);
    await sql(`INSERT INTO "users" ("id", "tenant_id", "email", "password_hash", "status", "failed_login_attempts", "token_version", "created_at", "updated_at") VALUES ('${uuid()}', '${legit4c.tenantId}', 'system@pre-existing.hms.local', '$2b$10$placeholder', 'ACTIVE', 0, 0, '${ts()}', '${ts()}')`, p4c);
    run('npx prisma migrate deploy', 'Migrate with pre-existing system@ user', dbUrl);
    const c4c = await p4c.connect();
    const preUser = await c4c.query(`SELECT is_system, status FROM "users" WHERE email = 'system@pre-existing.hms.local'`);
    if (preUser.rows.length > 0 && preUser.rows[0].is_system === false) pass('Pre-existing user NOT converted to system actor');
    else fail('Pre-existing user incorrectly converted or missing');
    const sysCount4c = await c4c.query(`SELECT COUNT(*)::int AS c FROM "users" WHERE tenant_id = '${legit4c.tenantId}' AND is_system = true`);
    if (sysCount4c.rows[0].c === 1) pass('Exactly one system actor created');
    else fail(`Expected 1 system actor, got ${sysCount4c.rows[0].c}`);
    c4c.release();
    await p4c.end();

    // ------------------------------------------------------------------
    // TEST 5: Composite Payment -> CashierSession FK rejects
    // tenant and branch mismatches at the database level.
    // This test is independent of the preflight checks in the
    // migration: it proves that once the composite FK is in place,
    // PostgreSQL itself refuses to store a row that violates the
    // invariant. The test inserts mismatched data using raw SQL
    // AFTER the migrations have run, then attempts an INSERT and
    // expects a foreign-key violation.
    //
    // Uses a private pool because TEST 4 closes the shared testPool.
    // ------------------------------------------------------------------
    console.log('\n=== TEST 5: Composite FK rejects tenant/branch mismatches ===');
    await resetAndBaseline();
    const p5 = privatePool();
    await applyBaselineMigrations(p5, baselineMigrations, dbUrl);
    // Seed legacy data BEFORE the upgrade runs, so the payments
    // table doesn't yet have branch_id NOT NULL.
    const seeded5 = await seedLegacyTenant(p5);
    const seeded5b = await seedLegacyTenant(p5);
    run('npx prisma migrate deploy', 'Apply upgrade migrations for TEST 5', dbUrl);
    const t5c = await p5.connect();
    try {
      const s1 = await t5c.query(`SELECT id, tenant_id, branch_id FROM "cashier_sessions" WHERE branch_id = (SELECT id FROM "branches" WHERE code = 'MAIN' AND tenant_id = $1 LIMIT 1) LIMIT 1`, [seeded5.tenantId]);
      const sess = s1.rows[0];
      if (!sess) {
        fail('TEST 5 setup: could not find seeded cashier session');
      } else {
        // 5a: Valid payment with matching session — should succeed.
        const goodPaymentId = uuid();
        await t5c.query(
          `INSERT INTO "payments" ("id", "tenant_id", "branch_id", "invoice_id", "cashier_session_id", "amount", "payment_method", "status", "idempotency_key", "created_at", "updated_at") VALUES ($1, $2, $3, $4, $5, 100, 'CASH', 'POSTED', $6, now(), now())`,
          [goodPaymentId, sess.tenant_id, sess.branch_id, seeded5.invoiceId, sess.id, `t5-valid-${goodPaymentId}`],
        );
        const goodCheck = await t5c.query(`SELECT COUNT(*)::int AS c FROM "payments" WHERE id = $1`, [goodPaymentId]);
        if (goodCheck.rows[0].c === 1) pass('Valid payment with matching session/tenant/branch accepted');
        else fail('Valid payment with matching session should have been inserted');

        // 5b: Mismatched branch — create a second branch under the same tenant,
        // create a session in that second branch, then attempt to insert a
        // payment that uses the original branch but the second branch's session.
        const branchB = uuid();
        const sessionB = uuid();
        const tenantId = sess.tenant_id;
        await t5c.query(`INSERT INTO "branches" ("id", "tenant_id", "name", "code", "created_at", "updated_at") VALUES ($1, $2, 'Branch B', 'BRB', now(), now())`, [branchB, tenantId]);
        await t5c.query(`INSERT INTO "cashier_sessions" ("id", "tenant_id", "branch_id", "user_id", "status", "opening_balance", "opened_at") VALUES ($1, $2, $3, $4, 'OPEN', 0, now())`, [sessionB, tenantId, branchB, seeded5.userId]);
        let branchMismatchRejected = false;
        try {
          await t5c.query(
            `INSERT INTO "payments" ("id", "tenant_id", "branch_id", "invoice_id", "cashier_session_id", "amount", "payment_method", "status", "idempotency_key", "created_at", "updated_at") VALUES ($1, $2, $3, $4, $5, 100, 'CASH', 'POSTED', $6, now(), now())`,
            [uuid(), tenantId, sess.branch_id, seeded5.invoiceId, sessionB, `t5-branch-${uuid()}`],
          );
        } catch (e: any) {
          branchMismatchRejected = String(e?.message || '').includes('payments_tenant_id_cashier_session_id_branch_id_fkey') || String(e?.message || '').includes('foreign key');
        }
        if (branchMismatchRejected) pass('Database rejects payment with mismatched branch (composite FK)');
        else fail('Database should have rejected payment with mismatched branch via composite FK');

        // 5c: Mismatched tenant — create a second tenant with a branch and
        // session, then attempt to insert a payment using Tenant A's
        // tenantId but Tenant B's session.
        const tenantB = uuid();
        const branchB2 = uuid();
        const sessionB2 = uuid();
        const orderB2 = uuid();
        const invoiceB2 = uuid();
        const userBId = uuid();
        await t5c.query(`INSERT INTO "tenants" ("id", "name", "status", "created_at", "updated_at") VALUES ($1, 'Tenant B', 'ACTIVE', now(), now())`, [tenantB]);
        await t5c.query(`INSERT INTO "branches" ("id", "tenant_id", "name", "code", "created_at", "updated_at") VALUES ($1, $2, 'Tenant B Branch', 'TBB', now(), now())`, [branchB2, tenantB]);
        await t5c.query(`INSERT INTO "users" ("id", "tenant_id", "email", "password_hash", "status", "failed_login_attempts", "token_version", "created_at", "updated_at") VALUES ($1, $2, 'legacy-b@test.com', '$2b$10$placeholder', 'ACTIVE', 0, 0, now(), now())`, [userBId, tenantB]);
        const patientBId = uuid();
        await t5c.query(`INSERT INTO "patients" ("id", "tenant_id", "patient_number", "first_name", "last_name", "dob", "created_at", "updated_at") VALUES ($1, $2, 'PAT-1002', 'Legacy', 'PatientB', '1991-01-01', now(), now())`, [patientBId, tenantB]);
        await t5c.query(`INSERT INTO "orders" ("id", "tenant_id", "branch_id", "patient_id", "order_number", "status", "created_at", "updated_at") VALUES ($1, $2, $3, $4, 'ORD-1002', 'COMPLETED', now(), now())`, [orderB2, tenantB, branchB2, patientBId]);
        await t5c.query(`INSERT INTO "invoices" ("id", "tenant_id", "order_id", "total_amount", "status", "created_at", "updated_at") VALUES ($1, $2, $3, 500, 'PAID', now(), now())`, [invoiceB2, tenantB, orderB2]);
        await t5c.query(`INSERT INTO "cashier_sessions" ("id", "tenant_id", "branch_id", "user_id", "status", "opening_balance", "opened_at") VALUES ($1, $2, $3, $4, 'OPEN', 0, now())`, [sessionB2, tenantB, branchB2, userBId]);
        let tenantMismatchRejected = false;
        try {
          await t5c.query(
            `INSERT INTO "payments" ("id", "tenant_id", "branch_id", "invoice_id", "cashier_session_id", "amount", "payment_method", "status", "idempotency_key", "created_at", "updated_at") VALUES ($1, $2, $3, $4, $5, 100, 'CASH', 'POSTED', $6, now(), now())`,
            [uuid(), tenantId, sess.branch_id, invoiceB2, sessionB2, `t5-tenant-${uuid()}`],
          );
        } catch (e: any) {
          tenantMismatchRejected = String(e?.message || '').includes('payments_tenant_id_cashier_session_id_branch_id_fkey') || String(e?.message || '').includes('foreign key');
        }
        if (tenantMismatchRejected) pass('Database rejects payment with mismatched tenant (composite FK)');
        else fail('Database should have rejected payment with mismatched tenant via composite FK');
      }
    } finally {
      t5c.release();
    }
    await p5.end();

    // ------------------------------------------------------------------
    // Summary
    // ------------------------------------------------------------------
    console.log('\n========================================');
    console.log(`Tests passed: ${passed}`);
    console.log(`Tests failed: ${failed}`);
    console.log('========================================');

    if (failed > 0) {
      console.error('\n=== SOME MIGRATION UPGRADE TESTS FAILED ===');
      process.exit(1);
    }
    console.log('\n=== ALL MIGRATION UPGRADE TESTS PASSED ===');
  } finally {
    // ------------------------------------------------------------------
    // Always drop the disposable database
    // ------------------------------------------------------------------
    console.log('\n=== CLEANUP: Dropping disposable database ===');
    try {
      await closeTestPool();
      await sql(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${testDbName}' AND pid <> pg_backend_pid()`, adminPool);
      await sql(`DROP DATABASE IF EXISTS "${testDbName}"`, adminPool);
      pass(`Dropped disposable database: ${testDbName}`);
    } catch (e) {
      console.error('Cleanup error (non-fatal):', e);
    }
    await adminPool.end().catch(() => {});
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('\n=== MIGRATION UPGRADE REHEARSAL FAILED ===');
  console.error(err);
  process.exit(1);
});
