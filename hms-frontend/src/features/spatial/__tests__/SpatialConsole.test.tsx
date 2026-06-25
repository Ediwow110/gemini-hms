import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SpatialConsole } from '../SpatialConsole';

describe('SpatialConsole — sandbox disclosure', () => {
  it('renders the sandbox notice', () => {
    render(<SpatialConsole />);
    expect(screen.getByTestId('spatial-console-notice')).toBeInTheDocument();
  });

  it('shows disclosure text about prototype demo', () => {
    render(<SpatialConsole />);
    expect(screen.getByText(/Sandbox Notice/i)).toBeInTheDocument();
    expect(screen.getByText(/prototype/i)).toBeInTheDocument();
  });

  it('does not render hardcoded pop-culture patient identifiers', () => {
    render(<SpatialConsole />);
    expect(screen.queryByText(/John Doe/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Jane Smith/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/PAT-1/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/PAT-2/i)).not.toBeInTheDocument();
  });

  it('renders neutral sandbox beacon identifiers', () => {
    render(<SpatialConsole />);
    expect(screen.getByText(/Patient Beacon 01/i)).toBeInTheDocument();
    expect(screen.getByText(/SIM-001/i)).toBeInTheDocument();
  });
});
