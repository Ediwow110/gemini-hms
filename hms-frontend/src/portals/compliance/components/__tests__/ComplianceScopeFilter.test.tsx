import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ComplianceScopeFilter from '../ComplianceScopeFilter';

describe('ComplianceScopeFilter', () => {
  it('is display-only and not an interactive scope control', () => {
    render(<ComplianceScopeFilter />);

    expect(screen.getByTestId('compliance-scope-filter').tagName).toBe('DIV');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByText('Display only')).toBeInTheDocument();
    expect(screen.getByText(/Compliance Scope \(Session Tenant\)/i)).toBeInTheDocument();
  });
});