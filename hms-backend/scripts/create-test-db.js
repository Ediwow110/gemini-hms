const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres',
  });

  await client.connect();
  try {
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname='hms_test'");
    if (res.rowCount === 0) {
      console.log("Database hms_test does not exist. Creating...");
      await client.query("CREATE DATABASE hms_test");
      console.log("Database hms_test created successfully.");
    } else {
      console.log("Database hms_test already exists.");
    }
  } catch (err) {
    console.error("Error creating database:", err);
  } finally {
    await client.end();
  }

  // Connect to hms_test and execute trigger creation script
  const testClient = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/hms_test',
  });
  await testClient.connect();
  try {
    console.log("Applying audit log triggers to hms_test database...");
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
    await testClient.query(sql);
    console.log("Audit log immutability trigger applied successfully to hms_test.");
  } catch (err) {
    console.error("Error applying triggers:", err);
  } finally {
    await testClient.end();
  }
}

main();
