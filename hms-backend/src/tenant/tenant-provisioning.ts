import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

export interface SystemActorResult {
  actorId: string;
}

export async function provisionSystemActor(
  tx: {
    user: {
      findFirst: (args: {
        where: { tenantId: string; isSystem: boolean };
        select: { id: boolean };
      }) => Promise<{ id: string } | null>;
      create: (args: {
        data: {
          id: string;
          tenantId: string;
          email: string;
          passwordHash: string;
          mfaEnabled: boolean;
          isSystem: boolean;
          status: string;
        };
      }) => Promise<{ id: string }>;
    };
  },
  tenantId: string,
): Promise<SystemActorResult> {
  const existing = await tx.user.findFirst({
    where: { tenantId, isSystem: true },
    select: { id: true },
  });
  if (existing) {
    return { actorId: existing.id };
  }

  const actorId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 12);

  await tx.user.create({
    data: {
      id: actorId,
      tenantId,
      email: `system@${tenantId.slice(0, 8)}.hms.local`,
      passwordHash,
      mfaEnabled: false,
      isSystem: true,
      status: 'DISABLED',
    },
  });

  return { actorId };
}
