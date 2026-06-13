import * as bcrypt from 'bcrypt';

export async function seedTestUser(prisma: any) {
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
  return prisma.user.upsert({
    where: { email: 'e2e-test@hms.local' },
    update: {},
    create: {
      email: 'e2e-test@hms.local',
      passwordHash: hashedPassword,
      tenantId: 'test-tenant-id',
      status: 'ACTIVE',
    },
  });
}
