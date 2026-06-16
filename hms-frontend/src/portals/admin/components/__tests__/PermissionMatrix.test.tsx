import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PermissionMatrix } from '../PermissionMatrix';

describe('PermissionMatrix honest-read-only tests', () => {
  it('renders the read-only header explaining deferred mutation wiring', () => {
    render(<PermissionMatrix selectedRole="Super Admin" />);
    expect(screen.getByText(/Read-Only Display/i)).toBeInTheDocument();
    expect(screen.getByText(/Mutation Wiring Deferred/i)).toBeInTheDocument();
  });

  it('Save Role Permissions button is disabled so it cannot imply a real save', () => {
    render(<PermissionMatrix selectedRole="Super Admin" />);
    const saveBtn = screen.getByTestId('permissionmatrix-save-button');
    expect(saveBtn).toBeInTheDocument();
    expect(saveBtn).toBeDisabled();
    expect(saveBtn).toHaveTextContent(/Save Role Permissions/);
  });

  it('does not render a fake success toast on mount', () => {
    render(<PermissionMatrix selectedRole="Super Admin" />);
    expect(
      screen.queryByText(/Permission mutations not yet wired/i),
    ).not.toBeInTheDocument();
  });
});
