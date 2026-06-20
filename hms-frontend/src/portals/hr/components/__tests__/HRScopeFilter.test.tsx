import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HRScopeFilter from '../HRScopeFilter';

describe('HRScopeFilter', () => {
  it('is display-only and not an interactive scope control', () => {
    render(<HRScopeFilter />);

    expect(screen.getByTestId('hr-scope-filter').tagName).toBe('DIV');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByText('Display only')).toBeInTheDocument();
    expect(screen.getByText(/Governance Scope \(Tenant-Wide\)/i)).toBeInTheDocument();
  });
});