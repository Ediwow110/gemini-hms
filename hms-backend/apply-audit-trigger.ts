import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applyTrigger() {
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

    CREATE TRIGGER audit_log_immutable
      BEFORE UPDATE OR DELETE ON audit_logs
      FOR EACH ROW
      EXECUTE FUNCTION prevent_audit_log_modification();
  `;
  
  await prisma.$executeRawUnsafe(sql);
  console.log('Audit log immutability trigger applied successfully.');
  await prisma.$disconnect();
}

applyTrigger().catch(console.error);
