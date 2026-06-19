import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserAccessTable } from '../UserAccessTable';
import { adminService } from '../../../../services/admin.service';

vi.mock('../../../../services/admin.service', () => ({
  adminService: {
    activateUser: vi.fn(),
    deactivateUser: vi.fn(),
  },
}));

const sampleUser = {
  id: 'U001',
  name: 'Maria Santos',
  email: 'maria@hms.com',
  tenant: 'St. Jude Hospital Network',
  branch: 'Metro Manila',
  role: 'Nurse',
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

describe('UserAccessTable privileged-action tests', () => {
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('does not fire a fake "Audit Action Logged" alert after edit_role confirmation', () => {
    render(<UserAccessTable users={[sampleUser]} />);

    fireEvent.click(screen.getByTitle('Edit Roles & Scopes'));
    expect(screen.getByText('Edit User Roles & Scopes')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Enter your reason...'), {
      target: { value: 'Quarterly role review' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    const fakeCalls = alertSpy.mock.calls.filter(
      (args: unknown[]) => typeof args[0] === 'string' && /Audit Action Logged/i.test(args[0]),
    );
    expect(fakeCalls).toHaveLength(0);
  });

  it('does not fire a fake "Audit Action Logged" alert after reset_mfa confirmation', () => {
    render(<UserAccessTable users={[sampleUser]} />);

    fireEvent.click(screen.getByTitle('Reset/Enforce MFA'));
    expect(screen.getByText('Reset User Multi-Factor Authentication (MFA)')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Enter your reason...'), {
      target: { value: 'Lost device replacement' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    const fakeCalls = alertSpy.mock.calls.filter(
      (args: unknown[]) => typeof args[0] === 'string' && /Audit Action Logged/i.test(args[0]),
    );
    expect(fakeCalls).toHaveLength(0);
  });

  it('does not fire a fake "Audit Action Logged" alert after toggle_status confirmation', async () => {
    vi.mocked(adminService.deactivateUser).mockResolvedValue({} as Awaited<ReturnType<typeof adminService.deactivateUser>>);

    render(<UserAccessTable users={[sampleUser]} />);

    fireEvent.click(screen.getByTitle('Lock Account'));
    expect(screen.getByText('Change User Account Status')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Enter your reason...'), {
      target: { value: 'Suspected compromise' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(adminService.deactivateUser).toHaveBeenCalledTimes(1));
    const fakeCalls = alertSpy.mock.calls.filter(
      (args: unknown[]) => typeof args[0] === 'string' && /Audit Action Logged/i.test(args[0]),
    );
    expect(fakeCalls).toHaveLength(0);
  });

  it('renders a sandbox notice before role confirmation explaining no mutation occurs', () => {
    render(<UserAccessTable users={[sampleUser]} />);
    fireEvent.click(screen.getByTitle('Edit Roles & Scopes'));

    const notice = screen.getByTestId('useraccess-sandbox-notice');
    expect(notice).toBeInTheDocument();
    expect(notice.textContent || '').toMatch(/no change will be persisted/i);
    expect(notice.textContent || '').not.toMatch(/Audit Action Logged/i);
  });

  it('closes the ReasonModal after role confirm but keeps the outcome banner visible', () => {
    render(<UserAccessTable users={[sampleUser]} />);

    fireEvent.click(screen.getByTitle('Edit Roles & Scopes'));
    expect(screen.getByText('Edit User Roles & Scopes')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Enter your reason...'), {
      target: { value: 'Quarterly review' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(screen.queryByText('Edit User Roles & Scopes')).not.toBeInTheDocument();
    const outcome = screen.getByTestId('useraccess-outcome');
    expect(outcome).toBeInTheDocument();
    expect(outcome.textContent || '').toMatch(/NOT persisted/i);
  });

  it('keeps role edit pending_wiring and never calls lifecycle APIs', () => {
    render(<UserAccessTable users={[sampleUser]} />);

    fireEvent.click(screen.getByTitle('Edit Roles & Scopes'));
    fireEvent.change(screen.getByPlaceholderText('Enter your reason...'), {
      target: { value: 'Quarterly role review' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    const outcome = screen.getByTestId('useraccess-outcome');
    expect(outcome).toBeInTheDocument();
    expect(outcome.getAttribute('data-outcome')).toBe('pending_wiring');
    expect(outcome.textContent || '').not.toMatch(/Audit Action Logged/i);
    expect(outcome.textContent || '').toMatch(/NOT persisted/i);
    expect(adminService.activateUser).not.toHaveBeenCalled();
    expect(adminService.deactivateUser).not.toHaveBeenCalled();
  });

  it('keeps MFA reset backend_unsupported and never calls lifecycle APIs', () => {
    render(<UserAccessTable users={[sampleUser]} />);

    fireEvent.click(screen.getByTitle('Reset/Enforce MFA'));
    fireEvent.change(screen.getByPlaceholderText('Enter your reason...'), {
      target: { value: 'Lost device replacement' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    const outcome = screen.getByTestId('useraccess-outcome');
    expect(outcome).toBeInTheDocument();
    expect(outcome.getAttribute('data-outcome')).toBe('backend_unsupported');
    expect(outcome.textContent || '').toMatch(/not wired to a backend endpoint/i);
    expect(adminService.activateUser).not.toHaveBeenCalled();
    expect(adminService.deactivateUser).not.toHaveBeenCalled();
  });

  it('active user status action calls deactivateUser with id and reason', async () => {
    vi.mocked(adminService.deactivateUser).mockResolvedValue({} as Awaited<ReturnType<typeof adminService.deactivateUser>>);

    render(<UserAccessTable users={[sampleUser]} />);

    fireEvent.click(screen.getByTitle('Lock Account'));
    fireEvent.change(screen.getByPlaceholderText('Enter your reason...'), {
      target: { value: 'Suspected compromise' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(adminService.deactivateUser).toHaveBeenCalledWith('U001', 'Suspected compromise'));
    expect(adminService.activateUser).not.toHaveBeenCalled();
  });

  it('suspended user status action calls activateUser with id and reason', async () => {
    vi.mocked(adminService.activateUser).mockResolvedValue({} as Awaited<ReturnType<typeof adminService.activateUser>>);

    render(<UserAccessTable users={[suspendedUser]} />);

    fireEvent.click(screen.getByTitle('Unlock Account'));
    fireEvent.change(screen.getByPlaceholderText('Enter your reason...'), {
      target: { value: 'Return to duty' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(adminService.activateUser).toHaveBeenCalledWith('U002', 'Return to duty'));
    expect(adminService.deactivateUser).not.toHaveBeenCalled();
  });

  it('locked user status action calls activateUser with id and reason', async () => {
    vi.mocked(adminService.activateUser).mockResolvedValue({} as Awaited<ReturnType<typeof adminService.activateUser>>);

    render(<UserAccessTable users={[lockedUser]} />);

    fireEvent.click(screen.getByTitle('Unlock Account'));
    fireEvent.change(screen.getByPlaceholderText('Enter your reason...'), {
      target: { value: 'Security review complete' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(adminService.activateUser).toHaveBeenCalledWith('U003', 'Security review complete'));
    expect(adminService.deactivateUser).not.toHaveBeenCalled();
  });

  it('reason shorter than 8 characters does not call backend and shows inline error', () => {
    render(<UserAccessTable users={[sampleUser]} />);

    fireEvent.click(screen.getByTitle('Lock Account'));
    fireEvent.change(screen.getByPlaceholderText('Enter your reason...'), {
      target: { value: 'short' },
    });
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
    fireEvent.change(screen.getByPlaceholderText('Enter your reason...'), {
      target: { value: 'Suspected compromise' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(adminService.deactivateUser).toHaveBeenCalledWith('U001', 'Suspected compromise'));
    expect(screen.getByTestId('useraccess-status-action-U001')).toBeDisabled();
    expect(screen.queryByTestId('useraccess-outcome')).not.toBeInTheDocument();

    resolveMutation();

    await waitFor(() => expect(onUsersChanged).toHaveBeenCalledTimes(1));
    const outcome = screen.getByTestId('useraccess-outcome');
    expect(outcome.getAttribute('data-outcome')).toBe('wired_success');
    expect(outcome.textContent || '').toMatch(/live admin lifecycle API/i);
  });

  it('backend failure shows mutation_error outcome and does not fake success', async () => {
    vi.mocked(adminService.deactivateUser).mockRejectedValue(new Error('Backend rejected lifecycle change'));
    const onUsersChanged = vi.fn();

    render(<UserAccessTable users={[sampleUser]} onUsersChanged={onUsersChanged} />);

    fireEvent.click(screen.getByTitle('Lock Account'));
    fireEvent.change(screen.getByPlaceholderText('Enter your reason...'), {
      target: { value: 'Suspected compromise' },
    });
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
