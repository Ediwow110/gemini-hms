import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersPage } from '../../UsersPage';
import { adminService } from '../../../../services/admin.service';

vi.mock('../../../../services/admin.service', () => ({
  adminService: {
    listUsers: vi.fn(),
    listRoles: vi.fn(),
    listBranches: vi.fn(),
    createUser: vi.fn(),
  },
}));

const emptyUsers = { data: [], total: 0, page: 1, limit: 20 };
const branchRows = {
  data: [{ id: 'branch-1', name: 'Main Branch', code: 'MAIN', createdAt: '', updatedAt: '' }],
  total: 1,
  page: 1,
  limit: 100,
};
const roleRows = [{ id: 'role-nurse', name: 'Nurse', status: 'ACTIVE', isSystem: false, permissions: [] }];

const selectFirstOption = (label: string) => {
  const select = screen.getByLabelText(label) as HTMLSelectElement;
  select.options[0].selected = true;
  fireEvent.change(select);
};

describe('UsersPage create account wiring', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(adminService.listUsers).mockResolvedValue(emptyUsers);
    vi.mocked(adminService.listBranches).mockResolvedValue(branchRows);
    vi.mocked(adminService.listRoles).mockResolvedValue(roleRows);
  });

  it('submits the create user DTO without client tenant id and refreshes the list', async () => {
    vi.mocked(adminService.createUser).mockResolvedValue({
      userId: 'user-1',
      email: 'new@hospital.test',
      status: 'ACTIVE',
      branchIds: ['branch-1'],
      roleIds: ['role-nurse'],
    });

    render(<UsersPage />);

    fireEvent.click(await screen.findByRole('button', { name: /Register New Account/i }));
    fireEvent.change(screen.getByPlaceholderText('operator@hospital.test'), {
      target: { value: 'NEW@HOSPITAL.TEST' },
    });
    fireEvent.change(screen.getByPlaceholderText('Set a temporary password'), {
      target: { value: 'TempPassword123!' },
    });
    selectFirstOption('Branches');
    selectFirstOption('Roles');
    fireEvent.change(screen.getByPlaceholderText('Minimum 8 characters'), {
      target: { value: 'Initial account setup' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => expect(adminService.createUser).toHaveBeenCalledTimes(1));
    const dto = vi.mocked(adminService.createUser).mock.calls[0][0] as unknown as Record<string, unknown>;
    expect(dto).toMatchObject({
      email: 'new@hospital.test',
      password: 'TempPassword123!',
      branchIds: ['branch-1'],
      roleIds: ['role-nurse'],
      reason: 'Initial account setup',
    });
    expect(dto).not.toHaveProperty('tenantId');
    await waitFor(() => expect(adminService.listUsers).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/Created new@hospital.test/i)).toBeInTheDocument();
  });

  it('shows inline error and does not alert when create user fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.mocked(adminService.createUser).mockRejectedValue(new Error('Email already exists'));

    render(<UsersPage />);

    fireEvent.click(await screen.findByRole('button', { name: /Register New Account/i }));
    fireEvent.change(screen.getByPlaceholderText('operator@hospital.test'), {
      target: { value: 'dupe@hospital.test' },
    });
    fireEvent.change(screen.getByPlaceholderText('Set a temporary password'), {
      target: { value: 'TempPassword123!' },
    });
    selectFirstOption('Branches');
    fireEvent.change(screen.getByPlaceholderText('Minimum 8 characters'), {
      target: { value: 'Duplicate account check' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email already exists');
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
