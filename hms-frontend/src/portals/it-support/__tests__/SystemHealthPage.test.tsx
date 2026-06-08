import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SystemHealthPage } from '../SystemHealthPage';
import { BrowserRouter } from 'react-router-dom';

const renderWithRouter = (ui: React.ReactElement) => render(ui, { wrapper: BrowserRouter });

describe('SystemHealthPage Redesign', () => {
  it('renders system health page with HMS shell and explicitly mocked data warning', () => {
    renderWithRouter(<SystemHealthPage />);
    
    expect(screen.getByText('System Health Monitor')).toBeInTheDocument();
    expect(screen.getByText('Sandbox Notice:')).toBeInTheDocument();
    expect(screen.getByText('All health metrics are simulated. No real infrastructure monitoring is running.')).toBeInTheDocument();
    expect(screen.getByText('HMS API Gateway')).toBeInTheDocument();
  });
});
