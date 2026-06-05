import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationDto } from './pagination.dto';
import { AuditPaginationDto } from './pagination.dto';

describe('PaginationDto', () => {
  it('accepts valid page and pageSize values', async () => {
    const dto = plainToInstance(PaginationDto, { page: 2, pageSize: 50 });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(2);
    expect(dto.pageSize).toBe(50);
  });

  it('accepts string numbers and transforms to integers via @Type', async () => {
    const dto = plainToInstance(PaginationDto, { page: '3', pageSize: '25' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(3);
    expect(dto.pageSize).toBe(25);
  });

  it('defaults page to 1 when omitted', async () => {
    const dto = plainToInstance(PaginationDto, { pageSize: 20 });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(20);
  });

  it('defaults pageSize to DEFAULT_PAGE_SIZE when omitted', async () => {
    const dto = plainToInstance(PaginationDto, { page: 2 });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(2);
    expect(dto.pageSize).toBe(50);
  });

  it('defaults both when omitted', async () => {
    const dto = plainToInstance(PaginationDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(50);
  });

  it('rejects page less than 1', async () => {
    const dto = plainToInstance(PaginationDto, { page: 0, pageSize: 20 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('rejects negative page', async () => {
    const dto = plainToInstance(PaginationDto, { page: -5, pageSize: 20 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('rejects pageSize less than 1', async () => {
    const dto = plainToInstance(PaginationDto, { page: 1, pageSize: 0 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'pageSize')).toBe(true);
  });

  it('rejects negative pageSize', async () => {
    const dto = plainToInstance(PaginationDto, { page: 1, pageSize: -10 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'pageSize')).toBe(true);
  });

  it('rejects pageSize exceeding MAX_PAGE_SIZE (100)', async () => {
    const dto = plainToInstance(PaginationDto, { page: 1, pageSize: 101 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'pageSize')).toBe(true);
  });

  it('accepts pageSize at MAX_PAGE_SIZE boundary', async () => {
    const dto = plainToInstance(PaginationDto, { page: 1, pageSize: 100 });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.pageSize).toBe(100);
  });

  it('rejects non-integer page', async () => {
    const dto = plainToInstance(PaginationDto, { page: 1.5, pageSize: 20 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('rejects non-integer pageSize', async () => {
    const dto = plainToInstance(PaginationDto, { page: 1, pageSize: 20.7 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'pageSize')).toBe(true);
  });

  it('rejects non-numeric page string', async () => {
    const dto = plainToInstance(PaginationDto, { page: 'abc', pageSize: 20 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('rejects non-numeric pageSize string', async () => {
    const dto = plainToInstance(PaginationDto, { page: 1, pageSize: 'abc' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'pageSize')).toBe(true);
  });

  it('does not permit unbounded take values (max enforced)', async () => {
    const dto = plainToInstance(PaginationDto, { page: 1, pageSize: 1000 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'pageSize')).toBe(true);
  });
});

describe('AuditPaginationDto', () => {
  it('accepts valid page and pageSize values', async () => {
    const dto = plainToInstance(AuditPaginationDto, { page: 2, pageSize: 150 });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(2);
    expect(dto.pageSize).toBe(150);
  });

  it('accepts string numbers and transforms to integers via @Type', async () => {
    const dto = plainToInstance(AuditPaginationDto, {
      page: '3',
      pageSize: '200',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(3);
    expect(dto.pageSize).toBe(200);
  });

  it('defaults page to 1 when omitted', async () => {
    const dto = plainToInstance(AuditPaginationDto, { pageSize: 120 });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(120);
  });

  it('defaults pageSize to DEFAULT_AUDIT_PAGE_SIZE (100) when omitted', async () => {
    const dto = plainToInstance(AuditPaginationDto, { page: 2 });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(2);
    expect(dto.pageSize).toBe(100);
  });

  it('defaults both when omitted', async () => {
    const dto = plainToInstance(AuditPaginationDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(100);
  });

  it('rejects page less than 1', async () => {
    const dto = plainToInstance(AuditPaginationDto, { page: 0, pageSize: 100 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('rejects negative page', async () => {
    const dto = plainToInstance(AuditPaginationDto, {
      page: -5,
      pageSize: 100,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('rejects pageSize less than 1', async () => {
    const dto = plainToInstance(AuditPaginationDto, { page: 1, pageSize: 0 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'pageSize')).toBe(true);
  });

  it('rejects negative pageSize', async () => {
    const dto = plainToInstance(AuditPaginationDto, { page: 1, pageSize: -10 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'pageSize')).toBe(true);
  });

  it('rejects pageSize exceeding MAX_AUDIT_PAGE_SIZE (250)', async () => {
    const dto = plainToInstance(AuditPaginationDto, { page: 1, pageSize: 251 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'pageSize')).toBe(true);
  });

  it('accepts pageSize at MAX_AUDIT_PAGE_SIZE boundary', async () => {
    const dto = plainToInstance(AuditPaginationDto, { page: 1, pageSize: 250 });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.pageSize).toBe(250);
  });

  it('rejects non-integer page', async () => {
    const dto = plainToInstance(AuditPaginationDto, {
      page: 1.5,
      pageSize: 100,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('rejects non-integer pageSize', async () => {
    const dto = plainToInstance(AuditPaginationDto, {
      page: 1,
      pageSize: 100.7,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'pageSize')).toBe(true);
  });

  it('rejects non-numeric page string', async () => {
    const dto = plainToInstance(AuditPaginationDto, {
      page: 'abc',
      pageSize: 100,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('rejects non-numeric pageSize string', async () => {
    const dto = plainToInstance(AuditPaginationDto, {
      page: 1,
      pageSize: 'abc',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'pageSize')).toBe(true);
  });

  it('clamps or validates too-large audit page size', async () => {
    const dto = plainToInstance(AuditPaginationDto, { page: 1, pageSize: 500 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'pageSize')).toBe(true);
  });

  it('preserves bounded behavior for audit/log style endpoints (MAX_AUDIT_PAGE_SIZE)', async () => {
    expect(AuditPaginationDto).toBeDefined();
    const dto = plainToInstance(AuditPaginationDto, { pageSize: 250 });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    // The class-validator Max decorator should enforce the 250 limit
    expect(dto.pageSize).toBe(250);
  });
});
