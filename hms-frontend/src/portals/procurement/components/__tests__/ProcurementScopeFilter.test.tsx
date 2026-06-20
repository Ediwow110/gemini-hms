import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProcurementScopeFilter from '../ProcurementScopeFilter';

describe('ProcurementScopeFilter', () => {
  it('is display-only and not an interactive scope control', () => {
    render(<ProcurementScopeFilter />);

    expect(screen.getByTestId('procurement-scope-filter').tagName).toBe('DIV');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByText('Display only')).toBeInTheDocument();
    expect(screen.getByText(/Supply Chain Scope \(Tenant-Wide\)/i)).toBeInTheDocument();
  });
});