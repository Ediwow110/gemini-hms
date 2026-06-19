import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import IntegrationScopeFilter from '../IntegrationScopeFilter';

describe('IntegrationScopeFilter', () => {
  it('is display-only and not an interactive scope control', () => {
    render(<IntegrationScopeFilter />);

    expect(screen.getByTestId('integration-scope-filter').tagName).toBe('DIV');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Display only')).toBeInTheDocument();
    expect(screen.getByText(/Cross-Domain \(Tenant-Wide\)/i)).toBeInTheDocument();
  });
});