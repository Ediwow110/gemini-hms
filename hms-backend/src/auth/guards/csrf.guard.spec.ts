import { Test, TestingModule } from '@nestjs/testing';
import { CsrfGuard } from './csrf.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('CsrfGuard', () => {
  let guard: CsrfGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CsrfGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<CsrfGuard>(CsrfGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  const mockContext = (
    method: string,
    cookies?: Record<string, string>,
    headers?: Record<string, string>,
    isPublic = false,
  ): ExecutionContext => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(isPublic);
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          cookies: cookies || {},
          headers: headers || {},
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  };

  describe('safe methods (GET, HEAD, OPTIONS)', () => {
    it('allows GET without CSRF token', () => {
      const ctx = mockContext('GET');
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('allows HEAD without CSRF token', () => {
      const ctx = mockContext('HEAD');
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('allows OPTIONS without CSRF token', () => {
      const ctx = mockContext('OPTIONS');
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('unsafe methods require CSRF', () => {
    it('rejects POST when csrf cookie is missing', () => {
      const ctx = mockContext('POST', {}, { 'x-csrf-token': 'token' });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('rejects POST when x-csrf-token header is missing', () => {
      const ctx = mockContext('POST', { csrf_token: 'token' }, {});
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('rejects POST when both cookie and header are missing', () => {
      const ctx = mockContext('POST');
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('rejects POST when cookie and header mismatch', () => {
      const ctx = mockContext(
        'POST',
        { csrf_token: 'cookie-token' },
        { 'x-csrf-token': 'header-token' },
      );
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('allows POST when cookie and header match', () => {
      const ctx = mockContext(
        'POST',
        { csrf_token: 'same-token' },
        { 'x-csrf-token': 'same-token' },
      );
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('rejects PUT when cookie and header mismatch', () => {
      const ctx = mockContext(
        'PUT',
        { csrf_token: 'cookie-a' },
        { 'x-csrf-token': 'header-b' },
      );
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('rejects PATCH when cookie and header mismatch', () => {
      const ctx = mockContext(
        'PATCH',
        { csrf_token: 'cookie-a' },
        { 'x-csrf-token': 'header-b' },
      );
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('rejects DELETE when cookie and header mismatch', () => {
      const ctx = mockContext(
        'DELETE',
        { csrf_token: 'cookie-a' },
        { 'x-csrf-token': 'header-b' },
      );
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('allows PUT when cookie and header match', () => {
      const ctx = mockContext(
        'PUT',
        { csrf_token: 'match' },
        { 'x-csrf-token': 'match' },
      );
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('allows PATCH when cookie and header match', () => {
      const ctx = mockContext(
        'PATCH',
        { csrf_token: 'match' },
        { 'x-csrf-token': 'match' },
      );
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('allows DELETE when cookie and header match', () => {
      const ctx = mockContext(
        'DELETE',
        { csrf_token: 'match' },
        { 'x-csrf-token': 'match' },
      );
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('public route bypass', () => {
    it('bypasses CSRF check for public POST routes', () => {
      const ctx = mockContext('POST', {}, {}, true);
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('bypasses CSRF check for public PUT routes', () => {
      const ctx = mockContext('PUT', {}, {}, true);
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('bypasses CSRF check for public DELETE routes', () => {
      const ctx = mockContext('DELETE', {}, {}, true);
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('allows public GET without CSRF (double coverage)', () => {
      const ctx = mockContext('GET', {}, {}, true);
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('non-public unsafe route still requires CSRF (public bypass is explicit)', () => {
      const ctx = mockContext('POST', {}, {}, false);
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('error messages', () => {
    it('throws "Missing CSRF token" when cookie or header absent', () => {
      const ctx = mockContext('POST', {}, {});
      expect(() => guard.canActivate(ctx)).toThrow('Missing CSRF token');
    });

    it('throws "Invalid CSRF token" on mismatch', () => {
      const ctx = mockContext(
        'POST',
        { csrf_token: 'a' },
        { 'x-csrf-token': 'b' },
      );
      expect(() => guard.canActivate(ctx)).toThrow('Invalid CSRF token');
    });
  });
});
