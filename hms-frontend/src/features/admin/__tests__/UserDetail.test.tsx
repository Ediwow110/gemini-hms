import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserDetail } from '../UserDetail';
import { adminService, type AdminUserItem } from '../../../services/admin.service';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'user-1' }),
  };
});

vi.mock('../../../services/admin.service', () => ({
  adminService: {
    getUser: vi.fn(),
    forceLogout: vi.fn(),
    resetPassword: vi.fn(),
    activateUser: vi.fn(),
    deactivateUser: vi.fn(),
  },
}));

const activeUser: AdminUserItem = {
  id: 'user-1',
  email: 'operator@hospital.test',
  tenantId: 'tenant-1',
  mfaEnabled: true,
  status: 'ACTIVE',
  deactivatedAt: null,
  lockedUntil: null,
  isSystem: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  roles: [{ id: 'role-1', name: 'Nurse', status: 'ACTIVE' }],
  branches: [{ id: 'branch-1', name: 'Main Branch', isActive: true }],
};

const inactiveUser: AdminUserItem = {
  ...activeUser,
  status: 'INACTIVE',
  deactivatedAt: '2026-01-03T00:00:00.000Z',
};

const renderPage = () => render(<MemoryRouter><UserDetail /></MemoryRouter>);

const openReasonModal = async (buttonName: RegExp | string) => {
  fireEvent.click(await screen.findByRole('button', { name: buttonName }));
  return screen.findByPlaceholderText('Enter your reason...');
};

describe('UserDetail admin action truth hardening', () => {
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.mocked(adminService.getUser).mockResolvedValue(activeUser);
    vi.mocked(adminService.forceLogout).mockResolvedValue(undefined);
    vi.mocked(adminService.resetPassword).mockResolvedValue({ tempPassword: 'TempSecure123!' });
    vi.mocked(adminService.activateUser).mockResolvedValue({
      userId: 'user-1',
      email: 'operator@hospital.test',
      status: 'ACTIVE',
      mfaEnabled: true,
      tokenVersion: 2,
      deactivatedAt: null,
    });
    vi.mocked(adminService.deactivateUser).mockResolvedValue({
      userId: 'user-1',
      email: 'operator@hospital.test',
      status: 'INACTIVE',
      mfaEnabled: true,
      tokenVersion: 2,
      deactivatedAt: '2026-01-03T00:00:00.000Z',
    });
  });

  it('force logout uses adminService and shows inline success without alert', async () => {
    renderPage();

    const reasonInput = await openReasonModal(/Force Logout/i);
    fireEvent.change(reasonInput, { target: { value: 'Security incident response' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(adminService.forceLogout).toHaveBeenCalledWith('user-1', 'Security incident response'));
    expect(await screen.findByRole('status')).toHaveTextContent(/forcibly logged out/i);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('reset password failure shows inline error without alert', async () => {
    vi.mocked(adminService.resetPassword).mockRejectedValue(new Error('Reset rejected by backend'));
    renderPage();

    const reasonInput = await openReasonModal(/Reset Password/i);
    fireEvent.change(reasonInput, { target: { value: 'Credential rotation' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(adminService.resetPassword).toHaveBeenCalledWith('user-1', 'Credential rotation'));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Reset rejected by backend/i);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('active account status action uses adminService.deactivateUser and updates inline state', async () => {
    renderPage();

    const reasonInput = await openReasonModal(/Suspend Account/i);
    fireEvent.change(reasonInput, { target: { value: 'Employment ended' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(adminService.deactivateUser).toHaveBeenCalledWith('user-1', 'Employment ended'));
    expect(await screen.findByRole('status')).toHaveTextContent(/Account suspended/i);
    expect(screen.getByText('Suspended')).toBeInTheDocument();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('inactive account status action uses adminService.activateUser and updates inline state', async () => {
    vi.mocked(adminService.getUser).mockResolvedValue(inactiveUser);
    renderPage();

    const reasonInput = await openReasonModal(/Activate Account/i);
    fireEvent.change(reasonInput, { target: { value: 'Return to duty' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(adminService.activateUser).toHaveBeenCalledWith('user-1', 'Return to duty'));
    expect(await screen.findByRole('status')).toHaveTextContent(/Account activated/i);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('short reason does not call backend and shows inline error', async () => {
    renderPage();

    const reasonInput = await openReasonModal(/Suspend Account/i);
    fireEvent.change(reasonInput, { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 8 characters/i);
    expect(adminService.activateUser).not.toHaveBeenCalled();
    expect(adminService.deactivateUser).not.toHaveBeenCalled();
    expect(adminService.forceLogout).not.toHaveBeenCalled();
    expect(adminService.resetPassword).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
