import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserAccessTable } from '../UserAccessTable';

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

describe('UserAccessTable privileged-action honesty tests', () => {
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('does not fire a fake "Audit Action Logged" alert after edit_role confirmation', () => {
    render(<UserAccessTable users={[sampleUser]} />);

    // Click the "Edit Roles & Scopes" icon button on the user row
    const editBtn = screen.getByTitle('Edit Roles & Scopes');
    fireEvent.click(editBtn);

    // Modal opens
    expect(
      screen.getByText('Edit User Roles & Scopes'),
    ).toBeInTheDocument();

    // Type a reason and confirm
    const textarea = screen.getByPlaceholderText('Enter your reason...');
    fireEvent.change(textarea, { target: { value: 'Quarterly role review' } });

    const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
    fireEvent.click(confirmBtn);

    // The fake "Audit Action Logged" alert must NOT fire.
    // Before the fix this alert was called and the test would fail.
    const fakeCalls = alertSpy.mock.calls.filter(
      (args: unknown[]) => typeof args[0] === 'string' && /Audit Action Logged/i.test(args[0]),
    );
    expect(fakeCalls).toHaveLength(0);
  });

  it('does not fire a fake "Audit Action Logged" alert after reset_mfa confirmation', () => {
    render(<UserAccessTable users={[sampleUser]} />);

    const mfaBtn = screen.getByTitle('Reset/Enforce MFA');
    fireEvent.click(mfaBtn);

    expect(
      screen.getByText('Reset User Multi-Factor Authentication (MFA)'),
    ).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText('Enter your reason...');
    fireEvent.change(textarea, { target: { value: 'Lost device' } });

    const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
    fireEvent.click(confirmBtn);

    const fakeCalls = alertSpy.mock.calls.filter(
      (args: unknown[]) => typeof args[0] === 'string' && /Audit Action Logged/i.test(args[0]),
    );
    expect(fakeCalls).toHaveLength(0);
  });

  it('does not fire a fake "Audit Action Logged" alert after toggle_status confirmation', () => {
    render(<UserAccessTable users={[sampleUser]} />);

    // For Active user the button title is "Lock Account"
    const statusBtn = screen.getByTitle('Lock Account');
    fireEvent.click(statusBtn);

    expect(
      screen.getByText('Change User Account Status'),
    ).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText('Enter your reason...');
    fireEvent.change(textarea, { target: { value: 'Suspected compromise' } });

    const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
    fireEvent.click(confirmBtn);

    const fakeCalls = alertSpy.mock.calls.filter(
      (args: unknown[]) => typeof args[0] === 'string' && /Audit Action Logged/i.test(args[0]),
    );
    expect(fakeCalls).toHaveLength(0);
  });

  it('renders a sandbox notice before confirmation explaining no mutation occurs', () => {
    render(<UserAccessTable users={[sampleUser]} />);
    const editBtn = screen.getByTitle('Edit Roles & Scopes');
    fireEvent.click(editBtn);

    // The sandbox notice is visible BEFORE the user types a reason.
    const notice = screen.getByTestId('useraccess-sandbox-notice');
    expect(notice).toBeInTheDocument();
    // The notice must explicitly say no change will be persisted.
    expect(notice.textContent || '').toMatch(/no change will be persisted/i);
    // The fake "Audit Action Logged" wording must NOT appear in the
    // pre-confirmation state either.
    expect(notice.textContent || '').not.toMatch(/Audit Action Logged/i);
  });

  it('renders a per-action honest outcome after edit_role confirmation (pending_wiring)', () => {
    render(<UserAccessTable users={[sampleUser]} />);
    fireEvent.click(screen.getByTitle('Edit Roles & Scopes'));

    const textarea = screen.getByPlaceholderText('Enter your reason...');
    fireEvent.change(textarea, { target: { value: 'Quarterly role review' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    const outcome = screen.getByTestId('useraccess-outcome');
    expect(outcome).toBeInTheDocument();
    expect(outcome.getAttribute('data-outcome')).toBe('pending_wiring');
    // The outcome must not contain the fake "Audit Action Logged" phrase.
    expect(outcome.textContent || '').not.toMatch(/Audit Action Logged/i);
    // The outcome must explicitly say nothing was persisted.
    expect(outcome.textContent || '').toMatch(/NOT persisted/i);
  });

  it('renders a per-action honest outcome after reset_mfa confirmation (backend_unsupported)', () => {
    render(<UserAccessTable users={[sampleUser]} />);
    fireEvent.click(screen.getByTitle('Reset/Enforce MFA'));

    const textarea = screen.getByPlaceholderText('Enter your reason...');
    fireEvent.change(textarea, { target: { value: 'Lost device' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    const outcome = screen.getByTestId('useraccess-outcome');
    expect(outcome).toBeInTheDocument();
    expect(outcome.getAttribute('data-outcome')).toBe('backend_unsupported');
    // The outcome must say the backend has no admin MFA-reset endpoint.
    expect(outcome.textContent || '').toMatch(/not wired to a backend endpoint/i);
  });
});
