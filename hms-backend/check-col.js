const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='failed_login_attempts'`
  .then(r => { console.log(r); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
