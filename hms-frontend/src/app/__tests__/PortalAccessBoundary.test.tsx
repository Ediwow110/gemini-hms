import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PortalAccessBoundary } from '../PortalAccessBoundary';

const mockCanAccess = vi.fn();

vi.mock('../../hooks/use-user', () => ({
  usePermissions: () => ({ canAccess: mockCanAccess }),
}));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <PortalAccessBoundary>
        <div data-testid="protected-content">Protected</div>
      </PortalAccessBoundary>
    </MemoryRouter>,
  );

describe('PortalAccessBoundary', () => {
  beforeEach(() => {
    mockCanAccess.mockReset();
  });

  it('passes the canonical route policy to canAccess', () => {
    mockCanAccess.mockReturnValue(true);
    renderAt('/field-service/deliveries');

    expect(mockCanAccess).toHaveBeenCalledWith({
      permission: 'field_service.job.view',
      allowedRoles: undefined,
      isBranchScoped: true,
      zone: 'staff',
    });
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('renders the unauthorized state when access is denied', () => {
    mockCanAccess.mockReturnValue(false);
    renderAt('/patient');

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Restriction Active')).toBeInTheDocument();
  });

  it('fails closed for a protected path missing from the route catalog', () => {
    mockCanAccess.mockReturnValue(true);
    renderAt('/unregistered-protected-route');

    expect(mockCanAccess).not.toHaveBeenCalled();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Restriction Active')).toBeInTheDocument();
  });
});
