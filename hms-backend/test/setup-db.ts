import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.test explicitly
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const dbUrl = process.env.DATABASE_URL;
console.log(`Setting up test database at ${dbUrl}...`);

async function main() {
  try {
    // Push the schema
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: dbUrl },
    });

    // Apply the trigger
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const sql = `
      CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'UPDATE' THEN
          RAISE EXCEPTION 'Audit log records are immutable and cannot be updated. Record ID: %', OLD.id;
        ELSIF TG_OP = 'DELETE' THEN
          RAISE EXCEPTION 'Audit log records are immutable and cannot be deleted. Record ID: %', OLD.id;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS audit_log_immutable ON audit_logs;
      CREATE TRIGGER audit_log_immutable
        BEFORE UPDATE OR DELETE ON audit_logs
        FOR EACH ROW
        EXECUTE FUNCTION prevent_audit_log_modification();
    `;

    await prisma.$executeRawUnsafe(sql);
    console.log('Audit log immutability trigger applied to test database.');
    await prisma.$disconnect();
  } catch (error) {
    console.error('Failed to set up test database:', error);
    process.exit(1);
  }
}

void main();
