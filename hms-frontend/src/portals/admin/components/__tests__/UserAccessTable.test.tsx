import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserAccessTable } from '../UserAccessTable';
import { adminService } from '../../../../services/admin.service';

vi.mock('../../../../services/admin.service', () => ({
  adminService: {
    activateUser: vi.fn(),
    deactivateUser: vi.fn(),
    forceLogout: vi.fn(),
    resetPassword: vi.fn(),
    resetUserMfa: vi.fn(),
    assignUserRole: vi.fn(),
    revokeUserRole: vi.fn(),
  },
}));

const sampleUser = {
  id: 'U001',
  name: 'Maria Santos',
  email: 'maria@hms.com',
  tenant: 'St. Jude Hospital Network',
  branch: 'Metro Manila',
  role: 'Nurse',
  roleIds: ['role1'],
  branchIds: ['branch1'],
  mfaEnabled: true,
  status: 'Active' as const,
  lastLogin: '2026-05-21 12:44',
};

const suspendedUser = {
  ...sampleUser,
  id: 'U002',
  name: 'Jose Reyes',
  email: 'jose@hms.com',
  status: 'Suspended' as const,
};

const lockedUser = {
  ...sampleUser,
  id: 'U003',
  name: 'Ana Cruz',
  email: 'ana@hms.com',
  status: 'Locked' as const,
};

const mockRoles = [
  { id: 'role1', name: 'Nurse', status: 'ACTIVE', isSystem: false, permissions: [] },
  { id: 'role2', name: 'Doctor', status: 'ACTIVE', isSystem: false, permissions: [] },
  { id: 'role3', name: 'Super Admin', status: 'ACTIVE', isSystem: true, permissions: [] },
];

describe('UserAccessTable privileged-action tests', () => {
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('renders all action buttons including force_logout and reset_password', () => {
    render(<UserAccessTable users={[sampleUser]} />);

    expect(screen.getByTitle('Edit Roles & Scopes')).toBeInTheDocument();
    expect(screen.getByTitle('Reset/Enforce MFA')).toBeInTheDocument();
    expect(screen.getByTitle('Reset Password')).toBeInTheDocument();
    expect(screen.getByTitle('Force Logout')).toBeInTheDocument();
    expect(screen.getByTitle('Lock Account')).toBeInTheDocument();
  });

  it('reset_password button calls adminService.resetPassword on confirm', async () => {
    vi.mocked(adminService.resetPassword).mockResolvedValue({ tempPassword: 'Temp-newPass123!' });

    render(<UserAccessTable users={[sampleUser]} />);

    fireEvent.click(screen.getByTitle('Reset Password'));
    expect(screen.getByText('Reset User Password')).toBeInTheDocument();

    const textareas = screen.getAllByPlaceholderText('Enter your reason...');
    fireEvent.change(textareas[0], { target: { value: 'User forgot password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(adminService.resetPassword).toHaveBeenCalledWith('U001', 'User forgot password'));
  });

  it('force_logout button calls adminService.forceLogout on confirm', async () => {
    vi.mocked(adminService.forceLogout).mockResolvedValue(undefined);

    render(<UserAccessTable users={[sampleUser]} />);

    fireEvent.click(screen.getByTitle('Force Logout'));
    expect(screen.getByText('Force User Logout')).toBeInTheDocument();

    const textareas = screen.getAllByPlaceholderText('Enter your reason...');
    fireEvent.change(textareas[0], { target: { value: 'Session compromised' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(adminService.forceLogout).toHaveBeenCalledWith('U001', 'Session compromised'));
  });

  it('edit_role button opens custom role picker dialog when availableRoles provided', () => {
    render(<UserAccessTable users={[sampleUser]} availableRoles={mockRoles} />);

    fireEvent.click(screen.getByTitle('Edit Roles & Scopes'));

    expect(screen.getByText('Edit User Roles')).toBeInTheDocument();
    expect(screen.getByText('Doctor')).toBeInTheDocument();
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('edit_role shows no roles message when availableRoles is empty or undefined', () => {
    render(<UserAccessTable users={[sampleUser]} />);

    fireEvent.click(screen.getByTitle('Edit Roles & Scopes'));

    expect(screen.getByText('No roles available from the server.')).toBeInTheDocument();
  });

  it('edit_role with role changes calls assignUserRole and revokeUserRole', async () => {
    vi.mocked(adminService.assignUserRole).mockResolvedValue({} as Awaited<ReturnType<typeof adminService.assignUserRole>>);
    vi.mocked(adminService.revokeUserRole).mockResolvedValue({} as Awaited<ReturnType<typeof adminService.revokeUserRole>>);

    render(<UserAccessTable users={[sampleUser]} availableRoles={mockRoles} />);

    fireEvent.click(screen.getByTitle('Edit Roles & Scopes'));

    // Uncheck Nurse (role1), check Doctor (role2)
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // Uncheck Nurse
    fireEvent.click(checkboxes[1]); // Check Doctor

    const textarea = screen.getByPlaceholderText('Minimum 8 characters');
    fireEvent.change(textarea, { target: { value: 'Quarterly role review' } });
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(adminService.revokeUserRole).toHaveBeenCalledWith('U001', 'role1', 'Quarterly role review');
      expect(adminService.assignUserRole).toHaveBeenCalledWith('U001', 'role2', 'Quarterly role review');
    });
  });

  it('edit_role with no changes shows no-changes outcome', async () => {
    render(<UserAccessTable users={[sampleUser]} availableRoles={mockRoles} />);

    fireEvent.click(screen.getByTitle('Edit Roles & Scopes'));

    const textarea = screen.getByPlaceholderText('Minimum 8 characters');
    fireEvent.change(textarea, { target: { value: 'Quarterly role review' } });
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      const outcome = screen.getByTestId('useraccess-outcome');
      expect(outcome.getAttribute('data-outcome')).toBe('wired_success');
      expect(outcome.textContent || '').toMatch(/No role changes/i);
    });
  });

  it('edit_role with no availableRoles shows message and Save Changes button', () => {
    render(<UserAccessTable users={[sampleUser]} />);

    fireEvent.click(screen.getByTitle('Edit Roles & Scopes'));

    expect(screen.getByText('No roles available from the server.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Minimum 8 characters')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('does not fire a fake "Audit Action Logged" alert after edit_role confirmation', () => {
    render(<UserAccessTable users={[sampleUser]} />);

    fireEvent.click(screen.getByTitle('Edit Roles & Scopes'));
    expect(screen.getByText('No roles available from the server.')).toBeInTheDocument();

    const fakeCalls = alertSpy.mock.calls.filter(
      (args: unknown[]) => typeof args[0] === 'string' && /Audit Action Logged/i.test(args[0]),
    );
    expect(fakeCalls).toHaveLength(0);
  });

  it('does not fire a fake "Audit Action Logged" alert after reset_mfa confirmation', () => {
    render(<UserAccessTable users={[sampleUser]} />);

    fireEvent.click(screen.getByTitle('Reset/Enforce MFA'));
    expect(screen.getByText('Reset User Multi-Factor Authentication (MFA)')).toBeInTheDocument();

    const textareas = screen.getAllByPlaceholderText('Enter your reason...');
    fireEvent.change(textareas[0], { target: { value: 'Lost device replacement' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    const fakeCalls = alertSpy.mock.calls.filter(
      (args: unknown[]) => typeof args[0] === 'string' && /Audit Action Logged/i.test(args[0]),
    );
    expect(fakeCalls).toHaveLength(0);
  });

  it('renders sandbox notice for edit_role explaining roles can be changed', () => {
    render(<UserAccessTable users={[sampleUser]} />);
    fireEvent.click(screen.getByTitle('Edit Roles & Scopes'));

    const notice = screen.getByTestId('useraccess-sandbox-notice');
    expect(notice).toBeInTheDocument();
    expect(notice.textContent || '').toMatch(/Role assignment and revocation/i);
  });

  it('calls resetUserMfa on MFA reset confirm and shows wired_success', async () => {
    vi.mocked(adminService.resetUserMfa).mockResolvedValue({} as Awaited<ReturnType<typeof adminService.resetUserMfa>>);

    render(<UserAccessTable users={[sampleUser]} />);

    fireEvent.click(screen.getByTitle('Reset/Enforce MFA'));
    expect(screen.getByText('Reset User Multi-Factor Authentication (MFA)')).toBeInTheDocument();

    const textareas = screen.getAllByPlaceholderText('Enter your reason...');
    fireEvent.change(textareas[0], { target: { value: 'Lost device replacement' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(adminService.resetUserMfa).toHaveBeenCalledWith('U001', 'Lost device replacement'));
    const outcome = await screen.findByTestId('useraccess-outcome');
    expect(outcome.getAttribute('data-outcome')).toBe('wired_success');
    expect(outcome.textContent || '').toMatch(/MFA reset successful/i);
    expect(adminService.activateUser).not.toHaveBeenCalled();
    expect(adminService.deactivateUser).not.toHaveBeenCalled();
  });

  it('active user status action calls deactivateUser with id and reason', async () => {
    vi.mocked(adminService.deactivateUser).mockResolvedValue({} as Awaited<ReturnType<typeof adminService.deactivateUser>>);

    render(<UserAccessTable users={[sampleUser]} />);

    fireEvent.click(screen.getByTitle('Lock Account'));

    const textareas = screen.getAllByPlaceholderText('Enter your reason...');
    fireEvent.change(textareas[0], { target: { value: 'Suspected compromise' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(adminService.deactivateUser).toHaveBeenCalledWith('U001', 'Suspected compromise'));
    expect(adminService.activateUser).not.toHaveBeenCalled();
  });

  it('suspended user status action calls activateUser with id and reason', async () => {
    vi.mocked(adminService.activateUser).mockResolvedValue({} as Awaited<ReturnType<typeof adminService.activateUser>>);

    render(<UserAccessTable users={[suspendedUser]} />);

    fireEvent.click(screen.getByTitle('Unlock Account'));

    const textareas = screen.getAllByPlaceholderText('Enter your reason...');
    fireEvent.change(textareas[0], { target: { value: 'Return to duty' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(adminService.activateUser).toHaveBeenCalledWith('U002', 'Return to duty'));
    expect(adminService.deactivateUser).not.toHaveBeenCalled();
  });

  it('locked user status action calls activateUser with id and reason', async () => {
    vi.mocked(adminService.activateUser).mockResolvedValue({} as Awaited<ReturnType<typeof adminService.activateUser>>);

    render(<UserAccessTable users={[lockedUser]} />);

    fireEvent.click(screen.getByTitle('Unlock Account'));

    const textareas = screen.getAllByPlaceholderText('Enter your reason...');
    fireEvent.change(textareas[0], { target: { value: 'Security review complete' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(adminService.activateUser).toHaveBeenCalledWith('U003', 'Security review complete'));
    expect(adminService.deactivateUser).not.toHaveBeenCalled();
  });

  it('reason shorter than 8 characters does not call backend and shows inline error', () => {
    render(<UserAccessTable users={[sampleUser]} />);

    fireEvent.click(screen.getByTitle('Lock Account'));

    const textareas = screen.getAllByPlaceholderText('Enter your reason...');
    fireEvent.change(textareas[0], { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(screen.getByRole('alert')).toHaveTextContent(/at least 8 characters/i);
    expect(adminService.activateUser).not.toHaveBeenCalled();
    expect(adminService.deactivateUser).not.toHaveBeenCalled();
  });

  it('successful lifecycle mutation calls onUsersChanged and shows wired_success only after backend success', async () => {
    let resolveMutation!: () => void;
    vi.mocked(adminService.deactivateUser).mockReturnValue(
      new Promise((resolve) => {
        resolveMutation = () => resolve({} as Awaited<ReturnType<typeof adminService.deactivateUser>>);
      }),
    );
    const onUsersChanged = vi.fn().mockResolvedValue(undefined);

    render(<UserAccessTable users={[sampleUser]} onUsersChanged={onUsersChanged} />);

    fireEvent.click(screen.getByTitle('Lock Account'));

    const textareas = screen.getAllByPlaceholderText('Enter your reason...');
    fireEvent.change(textareas[0], { target: { value: 'Suspected compromise' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(adminService.deactivateUser).toHaveBeenCalledWith('U001', 'Suspected compromise'));
    expect(screen.getByTestId('useraccess-status-action-U001')).toBeDisabled();
    expect(screen.queryByTestId('useraccess-outcome')).not.toBeInTheDocument();

    resolveMutation();

    await waitFor(() => expect(onUsersChanged).toHaveBeenCalledTimes(1));
    const outcome = await screen.findByTestId('useraccess-outcome');
    expect(outcome.getAttribute('data-outcome')).toBe('wired_success');
    expect(outcome.textContent || '').toMatch(/live admin lifecycle API/i);
  });

  it('backend failure shows mutation_error outcome and does not fake success', async () => {
    vi.mocked(adminService.deactivateUser).mockRejectedValue(new Error('Backend rejected lifecycle change'));
    const onUsersChanged = vi.fn();

    render(<UserAccessTable users={[sampleUser]} onUsersChanged={onUsersChanged} />);

    fireEvent.click(screen.getByTitle('Lock Account'));

    const textareas = screen.getAllByPlaceholderText('Enter your reason...');
    fireEvent.change(textareas[0], { target: { value: 'Suspected compromise' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(adminService.deactivateUser).toHaveBeenCalledTimes(1));
    const outcome = await screen.findByTestId('useraccess-outcome');
    expect(outcome.getAttribute('data-outcome')).toBe('mutation_error');
    expect(outcome.textContent || '').toMatch(/Backend rejected lifecycle change/i);
    expect(outcome.textContent || '').not.toMatch(/live admin lifecycle API/i);
    expect(onUsersChanged).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
