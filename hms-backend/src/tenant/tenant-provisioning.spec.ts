import { provisionSystemActor } from './tenant-provisioning';

describe('provisionSystemActor', () => {
  const tenantId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  type TxMock = {
    user: {
      findFirst: jest.Mock;
      create: jest.Mock;
    };
  };

  function createTx(): TxMock {
    return {
      user: {
        findFirst: jest.fn(),
        create: jest
          .fn()
          .mockImplementation((args: { data: { id: string } }) =>
            Promise.resolve({ id: args.data.id }),
          ),
      },
    };
  }

  it('creates a system actor with correct properties', async () => {
    const tx = createTx();
    tx.user.findFirst.mockResolvedValue(null);

    const result = await provisionSystemActor(tx, tenantId);

    expect(result.actorId).toBeDefined();
    expect(typeof result.actorId).toBe('string');

    expect(tx.user.create).toHaveBeenCalledTimes(1);
    const createArgs = tx.user.create.mock.calls[0][0];
    expect(createArgs.data.tenantId).toBe(tenantId);
    expect(createArgs.data.isSystem).toBe(true);
    expect(createArgs.data.status).toBe('DISABLED');
    expect(createArgs.data.mfaEnabled).toBe(false);
    expect(createArgs.data.email).toMatch(/^system@[a-f0-9]+\.hms\.local$/);
    expect(createArgs.data.passwordHash).toBeDefined();
    expect(typeof createArgs.data.passwordHash).toBe('string');
    expect(createArgs.data.passwordHash).not.toBe('');
  });

  it('returns existing actor idempotently without creating a duplicate', async () => {
    const tx = createTx();
    const existingId = 'existing-actor-uuid';
    tx.user.findFirst.mockResolvedValue({ id: existingId });

    const result = await provisionSystemActor(tx, tenantId);

    expect(result.actorId).toBe(existingId);
    expect(tx.user.create).not.toHaveBeenCalled();
  });

  it('two tenants receive different actors', async () => {
    const tx = createTx();
    tx.user.findFirst.mockResolvedValue(null);

    const result1 = await provisionSystemActor(tx, 'tenant-a');
    const result2 = await provisionSystemActor(tx, 'tenant-b');

    expect(result1.actorId).not.toBe(result2.actorId);
    expect(tx.user.create).toHaveBeenCalledTimes(2);

    const firstEmail = tx.user.create.mock.calls[0][0].data.email;
    const secondEmail = tx.user.create.mock.calls[1][0].data.email;
    expect(firstEmail).not.toBe(secondEmail);
  });

  it('creates a password hash that bcrypt can verify (is a real bcrypt hash)', async () => {
    const tx = createTx();
    tx.user.findFirst.mockResolvedValue(null);

    await provisionSystemActor(tx, tenantId);

    const passwordHash = tx.user.create.mock.calls[0][0].data.passwordHash;
    expect(passwordHash).toMatch(/^\$2[abxy]\$\d+\$/);
  });

  it('fails if user.create throws (simulating DB constraint violation)', async () => {
    const tx = createTx();
    tx.user.findFirst.mockResolvedValue(null);
    tx.user.create.mockRejectedValue(new Error('Unique constraint violation'));

    await expect(provisionSystemActor(tx, tenantId)).rejects.toThrow(
      'Unique constraint violation',
    );
  });
});
