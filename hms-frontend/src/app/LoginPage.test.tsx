import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';

// Mock LoginForm
vi.mock('../features/auth/LoginForm', () => ({
  LoginForm: () => <div data-testid="login-form">LoginForm Mock</div>,
}));

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../hooks/use-user', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock role-portal-resolver
vi.mock('./role-portal-resolver', () => ({
  getSafePortalPath: vi.fn(() => '/admin/dashboard'),
}));

const renderLoginPage = () => {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });
  });

  describe('Layout', () => {
    it('renders the login page layout', () => {
      renderLoginPage();

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    it('shows the branding/logo area with hospital icon', () => {
      renderLoginPage();

      // Mobile logo area
      expect(screen.getByText('HMS Core')).toBeInTheDocument();
    });

    it('renders the LoginForm component', () => {
      renderLoginPage();

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByText('LoginForm Mock')).toBeInTheDocument();
    });

    it('renders the secure portal heading on desktop', () => {
      renderLoginPage();

      expect(screen.getByText('Secure Portal')).toBeInTheDocument();
      expect(screen.getByText('Please enter your credentials to access the system.')).toBeInTheDocument();
    });

    it('renders the authorized personnel notice', () => {
      renderLoginPage();

      expect(screen.getByText('Authorized Personnel Only')).toBeInTheDocument();
    });

    it('renders the system version footer', () => {
      renderLoginPage();

      expect(screen.getByText(/HMS Core v2\.0/)).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('renders hero content section for large screens', () => {
      renderLoginPage();

      expect(screen.getByText(/Next-Generation/)).toBeInTheDocument();
      expect(screen.getByText(/Healthcare Operations/)).toBeInTheDocument();
    });

    it('renders compliance badges in hero section', () => {
      renderLoginPage();

      expect(screen.getByText('Compliance-Aligned Controls')).toBeInTheDocument();
      expect(screen.getByText('Release Candidate')).toBeInTheDocument();
    });

    it('renders mobile logo section', () => {
      renderLoginPage();

      // Mobile logo is hidden on lg screens but present in DOM
      expect(screen.getByText('HMS Core')).toBeInTheDocument();
    });
  });

  describe('Auth State Handling', () => {
    it('shows loading spinner when auth state is loading', () => {
      mockUseAuth.mockReturnValue({ user: null, isLoading: true });

      const { container } = renderLoginPage();

      // Should show spinner, not the login form
      expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('redirects authenticated user to their portal', () => {
      mockUseAuth.mockReturnValue({
        user: {
          defaultPortalPath: '/admin/dashboard',
          roles: ['Super Admin'],
          permissions: ['all'],
        },
        isLoading: false,
      });

      renderLoginPage();

      // Should not render login form when user is authenticated
      expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
    });
  });
});
