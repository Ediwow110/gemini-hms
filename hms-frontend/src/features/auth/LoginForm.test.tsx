import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginForm } from './LoginForm';

// Mock Vite env before imports — vitest v4 sets env via stubEnv before module evaluation
beforeAll(() => {
  vi.stubEnv('VITE_DEMO_PASSWORD', 'Admin@123');
});

// Mock apiClient
const mockPost = vi.fn();
const mockGet = vi.fn();
vi.mock('../../lib/api', () => ({
  apiClient: {
    post: (...args: unknown[]) => mockPost(...args),
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuth
const mockRefetchUser = vi.fn();
vi.mock('../../hooks/use-user', () => ({
  useAuth: () => ({ refetchUser: mockRefetchUser }),
}));

// Mock role-portal-resolver
vi.mock('../../app/role-portal-resolver', () => ({
  getSafePortalPath: vi.fn(() => '/admin/dashboard'),
  isKnownPortalPath: vi.fn(() => true),
}));

// Mock patient portal service
vi.mock('../../services/patient-portal.service', () => ({
  patientPortalService: { login: vi.fn() },
}));

const renderLoginForm = () => {
  return render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>,
  );
};

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders email and password fields', () => {
      renderLoginForm();

      expect(screen.getByPlaceholderText('name@hospital.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    it('renders tenant/branch selector field', () => {
      renderLoginForm();

      expect(screen.getByPlaceholderText('e.g. Central Hospital')).toBeInTheDocument();
      expect(screen.getByText('Organization / Tenant Code')).toBeInTheDocument();
    });

    it('renders the submit button', () => {
      renderLoginForm();

      expect(screen.getByRole('button', { name: /Sign in to Dashboard/i })).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows validation errors for empty fields on submit', async () => {
      // In DEV mode, fields are pre-filled, so clear them first
      renderLoginForm();

      const tenantInput = screen.getByPlaceholderText('e.g. Central Hospital');
      const emailInput = screen.getByPlaceholderText('name@hospital.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');

      fireEvent.change(tenantInput, { target: { value: '' } });
      fireEvent.change(emailInput, { target: { value: '' } });
      fireEvent.change(passwordInput, { target: { value: '' } });

      fireEvent.click(screen.getByRole('button', { name: /Sign in to Dashboard/i }));

      await waitFor(() => {
        expect(screen.getByText('Tenant code is required')).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });
    });

    it('rejects invalid email format via schema validation', async () => {
      // Test the Zod schema directly — more reliable than fighting
      // react-hook-form's internal state with DEV-mode pre-filled defaults
      const { loginSchema } = await import('./login-schema');
      const result = loginSchema.safeParse({
        tenantCode: 'Central Hospital',
        email: 'not-an-email',
        password: 'ValidPass@123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find((i) => i.path.includes('email'));
        expect(emailError?.message).toBe('Invalid email address');
      }
    });
  });

  describe('Form Submission', () => {
    it('submits login form with correct data', async () => {
      mockPost.mockResolvedValue({
        data: {
          user: { defaultPortalPath: '/admin/dashboard', roles: ['Super Admin'], permissions: [] },
          requiresBranchSelection: false,
        },
        status: 200,
      });

      renderLoginForm();

      // In DEV mode, fields are pre-filled with admin@hospital.com
      fireEvent.click(screen.getByRole('button', { name: /Sign in to Dashboard/i }));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/v1/auth/login', expect.objectContaining({
          email: 'admin@hospital.com',
          password: 'Admin@123',
          tenantCode: 'Central Hospital (Main Branch)',
        }));
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard', { replace: true });
      });
    });

    it('shows error message on failed login', async () => {
      mockPost.mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Invalid credentials' },
        },
      });

      renderLoginForm();

      fireEvent.click(screen.getByRole('button', { name: /Sign in to Dashboard/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('shows generic error message when no specific message is returned', async () => {
      mockPost.mockRejectedValue({
        response: { status: 500, data: {} },
      });

      renderLoginForm();

      fireEvent.click(screen.getByRole('button', { name: /Sign in to Dashboard/i }));

      await waitFor(() => {
        expect(screen.getByText('Login failed. Please check your credentials.')).toBeInTheDocument();
      });
    });
  });

  describe('MFA Flow', () => {
    it('shows MFA input when API returns mfaToken with MFA_REQUIRED message', async () => {
      mockPost.mockResolvedValue({
        data: { message: 'MFA_REQUIRED', mfaToken: 'mfa-token-123' },
        status: 202,
      });

      renderLoginForm();

      fireEvent.click(screen.getByRole('button', { name: /Sign in to Dashboard/i }));

      await waitFor(() => {
        expect(screen.getByText('Security Verification')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g. 123456')).toBeInTheDocument();
      });
    });

    it('shows MFA input when API returns 202 status in error response', async () => {
      mockPost.mockRejectedValue({
        response: {
          status: 202,
          data: { message: 'MFA_REQUIRED', mfaToken: 'mfa-token-456' },
        },
      });

      renderLoginForm();

      fireEvent.click(screen.getByRole('button', { name: /Sign in to Dashboard/i }));

      await waitFor(() => {
        expect(screen.getByText('Security Verification')).toBeInTheDocument();
      });
    });

    it('verifies MFA code and navigates on success', async () => {
      // First call: login returns MFA required
      mockPost.mockResolvedValueOnce({
        data: { message: 'MFA_REQUIRED', mfaToken: 'mfa-token-789' },
        status: 202,
      });

      renderLoginForm();

      fireEvent.click(screen.getByRole('button', { name: /Sign in to Dashboard/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g. 123456')).toBeInTheDocument();
      });

      // Second call: MFA verify succeeds
      mockPost.mockResolvedValueOnce({
        data: {
          user: { defaultPortalPath: '/admin/dashboard', roles: ['Super Admin'], permissions: [] },
          requiresBranchSelection: false,
        },
        status: 200,
      });

      const mfaInput = screen.getByPlaceholderText('e.g. 123456');
      fireEvent.change(mfaInput, { target: { value: '123456' } });

      fireEvent.click(screen.getByRole('button', { name: /Verify & Authenticate/i }));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(
          '/v1/auth/mfa/verify',
          { code: '123456' },
          { headers: { 'X-MFA-Token': 'mfa-token-789' } },
        );
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard', { replace: true });
      });
    });

    it('shows error for invalid MFA code length', async () => {
      mockPost.mockResolvedValueOnce({
        data: { message: 'MFA_REQUIRED', mfaToken: 'mfa-token-abc' },
        status: 202,
      });

      renderLoginForm();

      fireEvent.click(screen.getByRole('button', { name: /Sign in to Dashboard/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g. 123456')).toBeInTheDocument();
      });

      const mfaInput = screen.getByPlaceholderText('e.g. 123456');
      fireEvent.change(mfaInput, { target: { value: '123' } });

      // Button should be disabled when code is not 6 digits
      const verifyBtn = screen.getByRole('button', { name: /Verify & Authenticate/i });
      expect(verifyBtn).toBeDisabled();
    });

    it('shows error on MFA verification failure', async () => {
      mockPost.mockResolvedValueOnce({
        data: { message: 'MFA_REQUIRED', mfaToken: 'mfa-token-fail' },
        status: 202,
      });

      renderLoginForm();

      fireEvent.click(screen.getByRole('button', { name: /Sign in to Dashboard/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g. 123456')).toBeInTheDocument();
      });

      mockPost.mockRejectedValueOnce({
        response: { data: { message: 'Invalid verification code' } },
      });

      const mfaInput = screen.getByPlaceholderText('e.g. 123456');
      fireEvent.change(mfaInput, { target: { value: '999999' } });

      fireEvent.click(screen.getByRole('button', { name: /Verify & Authenticate/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid verification code')).toBeInTheDocument();
      });
    });

    it('can navigate back to login from MFA screen', async () => {
      mockPost.mockResolvedValueOnce({
        data: { message: 'MFA_REQUIRED', mfaToken: 'mfa-token-back' },
        status: 202,
      });

      renderLoginForm();

      fireEvent.click(screen.getByRole('button', { name: /Sign in to Dashboard/i }));

      await waitFor(() => {
        expect(screen.getByText('Security Verification')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Back to Login'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Sign in to Dashboard/i })).toBeInTheDocument();
        expect(screen.queryByText('Security Verification')).not.toBeInTheDocument();
      });
    });
  });

  describe('Demo Account Quick-Fill (DEV mode)', () => {
    it('shows demo account button in dev mode', () => {
      renderLoginForm();

      expect(screen.getByText('Use Demo Account')).toBeInTheDocument();
    });

    it('shows demo account selector when button is clicked', () => {
      renderLoginForm();

      fireEvent.click(screen.getByText('Use Demo Account'));

      expect(screen.getByText('Quick Demo Access')).toBeInTheDocument();
      expect(screen.getByText('Super Admin')).toBeInTheDocument();
      expect(screen.getByText('Doctor')).toBeInTheDocument();
      expect(screen.getByText('Patient')).toBeInTheDocument();
    });

    it('fills form fields when a demo account is selected', () => {
      renderLoginForm();

      fireEvent.click(screen.getByText('Use Demo Account'));
      fireEvent.click(screen.getByText('Doctor'));

      // After selecting, demo selector closes and form should be visible
      expect(screen.queryByText('Quick Demo Access')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign in to Dashboard/i })).toBeInTheDocument();
    });

    it('cancels demo selector and returns to login form', () => {
      renderLoginForm();

      fireEvent.click(screen.getByText('Use Demo Account'));
      expect(screen.getByText('Quick Demo Access')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Cancel'));

      expect(screen.queryByText('Quick Demo Access')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign in to Dashboard/i })).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading state during submission', async () => {
      // Make the post hang (never resolve) to observe loading state
      mockPost.mockImplementation(() => new Promise(() => {}));

      renderLoginForm();

      fireEvent.click(screen.getByRole('button', { name: /Sign in to Dashboard/i }));

      await waitFor(() => {
        expect(screen.getByText('Processing...')).toBeInTheDocument();
      });
    });

    it('disables submit button during loading', async () => {
      mockPost.mockImplementation(() => new Promise(() => {}));

      renderLoginForm();

      fireEvent.click(screen.getByRole('button', { name: /Sign in to Dashboard/i }));

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Processing.../i });
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Branch Selection', () => {
    it('shows branch selection when requiresBranchSelection is true', async () => {
      mockPost.mockResolvedValue({
        data: { requiresBranchSelection: true },
        status: 200,
      });
      mockGet.mockResolvedValue({
        data: [
          { id: 'b1', name: 'Main Branch', code: 'MAIN' },
          { id: 'b2', name: 'North Wing', code: 'NORTH' },
        ],
      });

      renderLoginForm();

      fireEvent.click(screen.getByRole('button', { name: /Sign in to Dashboard/i }));

      await waitFor(() => {
        expect(screen.getByText('Select Branch')).toBeInTheDocument();
        expect(screen.getByText('Main Branch')).toBeInTheDocument();
        expect(screen.getByText('North Wing')).toBeInTheDocument();
      });
    });
  });
});
