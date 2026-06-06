import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../use-user';
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
