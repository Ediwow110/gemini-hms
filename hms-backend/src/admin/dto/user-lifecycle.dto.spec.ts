import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCustomRoleDto } from './user-lifecycle.dto';

describe('CreateCustomRoleDto', () => {
  it('rejects blank name', async () => {
    const dto = plainToInstance(CreateCustomRoleDto, {
      name: '   ',
      reason: 'valid',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejects blank reason', async () => {
    const dto = plainToInstance(CreateCustomRoleDto, {
      name: 'valid',
      reason: '   ',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'reason')).toBe(true);
  });

  it('rejects blank permissionIds entries', async () => {
    const dto = plainToInstance(CreateCustomRoleDto, {
      name: 'valid',
      reason: 'valid',
      permissionIds: ['valid', '   '],
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'permissionIds')).toBe(true);
  });

  it('rejects duplicate permissionIds', async () => {
    const dto = plainToInstance(CreateCustomRoleDto, {
      name: 'valid',
      reason: 'valid',
      permissionIds: ['perm1', 'perm1'],
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'permissionIds')).toBe(true);
  });
  it('rejects duplicate permissionIds even if they only differ by whitespace', async () => {
    const dto = plainToInstance(CreateCustomRoleDto, {
      name: 'valid',
      reason: 'valid',
      permissionIds: ['perm1', ' perm1 '],
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'permissionIds')).toBe(true);
  });

  it('rejects non-string permissionIds entries', async () => {
    const dto = plainToInstance(CreateCustomRoleDto, {
      name: 'valid',
      reason: 'valid',
      permissionIds: ['perm1', 123],
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'permissionIds')).toBe(true);
  });

  it('allows empty permissionIds array', async () => {
    const dto = plainToInstance(CreateCustomRoleDto, {
      name: 'valid',
      reason: 'valid',
      permissionIds: [],
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('allows missing permissionIds', async () => {
    const dto = plainToInstance(CreateCustomRoleDto, {
      name: 'valid',
      reason: 'valid',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
