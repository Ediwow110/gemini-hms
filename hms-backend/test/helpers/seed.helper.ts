import * as bcrypt from 'bcrypt';

export async function seedTenants(prisma: any) {
  const tenantA = await prisma.tenant.upsert({
    where: { id: '123e4567-e89b-12d3-a456-426614174000' },
    update: {},
    create: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Tenant A',
    },
  });
  const tenantB = await prisma.tenant.upsert({
    where: { id: '123e4567-e89b-12d3-a456-426614174002' },
    update: {},
    create: {
      id: '123e4567-e89b-12d3-a456-426614174002',
      name: 'Tenant B',
    },
  });
  return { tenantA, tenantB };
}

export async function seedUser(prisma: any, tenantId: string, email: string) {
  const hashedPassword = await bcrypt.hash('Test1234!', 10);
  return prisma.user.upsert({
    where: { id: '11111111-1111-4111-8111-111111111111' },
    update: { email, tenantId },
    create: {
      id: '11111111-1111-4111-8111-111111111111',
      email,
      passwordHash: hashedPassword,
      tenantId,
      status: 'ACTIVE',
    },
  });
}
