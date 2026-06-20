import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';

const mockUseAuth = vi.fn();

vi.mock('../../hooks/use-user', () => ({
  useAuth: () => mockUseAuth(),
}));

const renderProtectedRoutes = () => {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Protected content</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute session-expired handoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders an explicit session-expired state for 401 auth failure instead of silently redirecting to login', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      authError: { response: { status: 401 } },
      logout: vi.fn(),
    });

    renderProtectedRoutes();

    expect(screen.getByRole('heading', { name: /Session Expired/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In Again/i })).toBeInTheDocument();
    expect(screen.queryByText(/Login page/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Protected content/i)).not.toBeInTheDocument();
  });

  it('preserves normal unauthenticated redirect when there is no expired-session auth error', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      authError: null,
      logout: vi.fn(),
    });

    renderProtectedRoutes();

    expect(screen.getByText(/Login page/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Session Expired/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Protected content/i)).not.toBeInTheDocument();
  });

  it('preserves authenticated access and does not show session-expired UI for a valid user', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'U-1', email: 'user@hms.test', roles: [], permissions: [] },
      isLoading: false,
      authError: null,
      logout: vi.fn(),
    });

    renderProtectedRoutes();

    expect(screen.getByText(/Protected content/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Session Expired/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Login page/i)).not.toBeInTheDocument();
  });
});
