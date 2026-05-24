import 'dotenv/config';

/**
 * Validates that the current environment is safe for demo/development scripts.
 * Prevents accidental execution against production or staging databases.
 */
export function validateDemoEnvironment(options: { 
  isDestructive?: boolean;
  allowRemote?: boolean;
} = {}) {
  const nodeEnv = process.env.NODE_ENV;
  const dbUrl = process.env.DATABASE_URL;

  // 1. NODE_ENV Guard
  const allowedEnvs = ['development', 'test', 'demo'];
  if (!nodeEnv || !allowedEnvs.includes(nodeEnv)) {
    console.error(`ERROR: Invalid NODE_ENV "${nodeEnv}". Demo scripts only allowed in: ${allowedEnvs.join(', ')}`);
    process.exit(1);
  }

  if (nodeEnv === 'production' || nodeEnv === 'staging') {
    console.error(`ERROR: Demo scripts ARE NEVER ALLOWED in "${nodeEnv}" environment.`);
    process.exit(1);
  }

  // 2. DATABASE_URL Existence
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL is not set.');
    process.exit(1);
  }

  // 3. DATABASE_URL Content Guard (Keywords)
  // Rejects common cloud provider and production naming patterns
  const forbiddenKeywords = ['prod', 'staging', 'cloudsql', 'amazonaws', 'supabase', 'neon', 'render', 'railway', 'azure', 'gcp', 'google'];
  const lowerDbUrl = dbUrl.toLowerCase();
  for (const keyword of forbiddenKeywords) {
    if (lowerDbUrl.includes(keyword)) {
      console.error(`ERROR: DATABASE_URL contains forbidden keyword "${keyword}". Access denied.`);
      process.exit(1);
    }
  }

  // 4. Database Name Guard
  // Extract DB name from postgresql://user:pass@host:port/dbname?options
  const dbNameMatch = dbUrl.match(/\/([^\/?]+)(\?|$)/);
  const dbName = dbNameMatch ? dbNameMatch[1] : '';
  const allowedDbNames = ['demo', 'test', 'local', 'hms_test', 'hms_demo', 'hms_local', 'hms_db'];
  const isAllowedDbName = allowedDbNames.some(name => dbName.toLowerCase().includes(name));
  
  if (!isAllowedDbName) {
    console.error(`ERROR: Database name "${dbName}" does not contain demo/test/local keywords. Access denied.`);
    process.exit(1);
  }

  // 5. Host Guard
  // Ensures DB is running locally or in a local docker network
  const isLocalHost = lowerDbUrl.includes('localhost') || lowerDbUrl.includes('127.0.0.1') || lowerDbUrl.includes('@db:');
  const allowRemote = process.env.DEMO_DB_ALLOW_REMOTE === 'true';

  if (!isLocalHost && !allowRemote) {
    console.error('ERROR: Database host is not localhost. To allow remote access to a NON-PRODUCTION database, set DEMO_DB_ALLOW_REMOTE=true');
    process.exit(1);
  }

  if (allowRemote && process.env.DEMO_DB_CONFIRM_REMOTE !== 'true') {
    console.error('ERROR: Remote database detected. Set DEMO_DB_CONFIRM_REMOTE=true to proceed with remote demo database.');
    process.exit(1);
  }

  // 6. Destructive Reset Guard
  if (options.isDestructive) {
    const confirmEnv = process.env.DEMO_DB_RESET_CONFIRM === 'RESET_SYNTHETIC_DEMO_DB';
    const confirmFlag = process.argv.includes('--confirm-demo-reset');

    if (!confirmEnv || !confirmFlag) {
      console.error('\n!!! DESTRUCTIVE ACTION DETECTED !!!');
      console.error('To proceed with resetting the demo database, you MUST:');
      console.error('1. Set environment variable: DEMO_DB_RESET_CONFIRM=RESET_SYNTHETIC_DEMO_DB');
      console.error('2. Pass CLI flag: --confirm-demo-reset');
      process.exit(1);
    }
  }

  console.log(`[SAFETY] Environment verified: ${nodeEnv}`);
  console.log(`[SAFETY] Database verified: ${dbName} (Local: ${isLocalHost})`);
}
