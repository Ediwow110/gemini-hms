import { execFileSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for E2E database setup.');
}

if (process.env.NODE_ENV !== 'test') {
  throw new Error('E2E database setup is allowed only when NODE_ENV=test.');
}

const parsedUrl = new URL(databaseUrl);
const databaseName = parsedUrl.pathname.replace(/^\//, '');
if (!databaseName || !databaseName.toLowerCase().includes('test')) {
  throw new Error(
    `Refusing to reset a database without "test" in its name: ${databaseName || '(empty)'}`,
  );
}

console.log(
  `Resetting isolated E2E database ${databaseName} at ${parsedUrl.hostname}:${parsedUrl.port || '5432'} using committed migrations.`,
);

try {
  const prismaCli = path.resolve(
    __dirname,
    '../node_modules/prisma/build/index.js',
  );
  execFileSync(process.execPath, [prismaCli, 'migrate', 'reset', '--force'], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
} catch (error) {
  console.error('Failed to reset the isolated E2E database.', error);
  process.exit(1);
}
