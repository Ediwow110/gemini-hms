import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../.env.test');
dotenv.config({ path: envPath, quiet: true });

const configuredUrl = process.env.DATABASE_URL;
if (!configuredUrl) {
  throw new Error('DATABASE_URL is required in .env.test.');
}

const parsed = new URL(configuredUrl);
const hostname = parsed.hostname.toLowerCase();
const databaseName = parsed.pathname.replace(/^\//, '');
const isLocalHost =
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

if (!isLocalHost || !databaseName.toLowerCase().includes('test')) {
  throw new Error(
    'Local migration rehearsal requires a localhost database whose name contains "test".',
  );
}

parsed.pathname = '/postgres';
process.env.DATABASE_URL = parsed.toString();
process.env.ALLOW_DESTRUCTIVE_MIGRATION_TEST = 'true';
process.env.NODE_ENV = 'test';

async function main(): Promise<void> {
  await import('./verify-migration-upgrade');
}

void main();
