import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth, AuthContext, usePermissions, UserState } from '../use-user';
import { apiClient } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  apiClient: {
    defaults: { baseURL: 'http://localhost:3000/api' },
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      response: {
        use: vi.fn(() => 1),
        eject: vi.fn(),
      },
    },
  },
}));

const AuthProbe = () => {
  const { isLoading, user } = useAuth();

  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="user">{user ? user.email : 'anonymous'}</span>
    </div>
  );
};

describe('AuthProvider', () => {
  afterEach(() => {
    vi.clearAllMocks();
    window.history.pushState(null, '', '/');
  });

  it('does not bootstrap the current user on the public login page', async () => {
    window.history.pushState(null, '', '/login');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));

    expect(screen.getByTestId('user')).toHaveTextContent('anonymous');
    expect(apiClient.get).not.toHaveBeenCalledWith('/v1/auth/me');
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});

describe('canAccess authorization parity', () => {
  const testAccess = (
    user: Partial<UserState>,
    opts: { permission?: string; allowedRoles?: string[]; isBranchScoped?: boolean; zone?: string }
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      render(
        <AuthContext.Provider
          value={{
            user: user as UserState,
            isLoading: false,
            logout: vi.fn(),
            refetchUser: vi.fn(),
          }}
        >
          <CanAccessTester opts={opts} callback={resolve} />
        </AuthContext.Provider>
      );
    });
  };

  const CanAccessTester = ({
    opts,
    callback,
  }: {
    opts: { permission?: string; allowedRoles?: string[]; isBranchScoped?: boolean; zone?: string };
    callback: (res: boolean) => void;
  }) => {
    const { canAccess } = usePermissions();
    React.useEffect(() => {
      callback(canAccess(opts));
    }, [canAccess, opts, callback]);
    return null;
  };

  it('allows access when no restrictions are defined', async () => {
    const user = { roles: ['Doctor'], permissions: [] };
    const res = await testAccess(user, {});
    expect(res).toBe(true);
  });

  it('allows access with role-only matching', async () => {
    const user = { roles: ['Doctor'], permissions: [] };
    const res = await testAccess(user, { allowedRoles: ['Doctor', 'Nurse'] });
    expect(res).toBe(true);
  });

  it('denies access with role-only mismatch', async () => {
    const user = { roles: ['Receptionist'], permissions: [] };
    const res = await testAccess(user, { allowedRoles: ['Doctor', 'Nurse'] });
    expect(res).toBe(false);
  });

  it('allows access with permission-only matching', async () => {
    const user = { roles: [], permissions: ['patient.view'] };
    const res = await testAccess(user, { permission: 'patient.view' });
    expect(res).toBe(true);
  });

  it('denies access with permission-only mismatch', async () => {
    const user = { roles: [], permissions: ['patient.create'] };
    const res = await testAccess(user, { permission: 'patient.view' });
    expect(res).toBe(false);
  });

  it('allows access with role plus permission matching', async () => {
    const user = { roles: ['Doctor'], permissions: ['patient.view'] };
    const res = await testAccess(user, {
      allowedRoles: ['Doctor'],
      permission: 'patient.view',
    });
    expect(res).toBe(true);
  });

  it('denies access with role match but permission mismatch', async () => {
    const user = { roles: ['Doctor'], permissions: [] };
    const res = await testAccess(user, {
      allowedRoles: ['Doctor'],
      permission: 'patient.view',
    });
    expect(res).toBe(false);
  });

  it('denies access with permission match but role mismatch', async () => {
    const user = { roles: ['Nurse'], permissions: ['patient.view'] };
    const res = await testAccess(user, {
      allowedRoles: ['Doctor'],
      permission: 'patient.view',
    });
    expect(res).toBe(false);
  });

  it('allows Super Admin global route bypass', async () => {
    const user = { roles: ['Super Admin'], permissions: [] };
    const res = await testAccess(user, { permission: 'patient.view' });
    expect(res).toBe(true);
  });

  it('enforces branch scope for Super Admin', async () => {
    const user = { roles: ['Super Admin'], permissions: [] };
    const res = await testAccess(user, {
      permission: 'patient.view',
      isBranchScoped: true,
    });
    expect(res).toBe(false);
  });
});
