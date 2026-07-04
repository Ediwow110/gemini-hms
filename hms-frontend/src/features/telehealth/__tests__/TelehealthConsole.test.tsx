import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TelehealthConsole } from '../TelehealthConsole';

describe('TelehealthConsole — sandbox disclosure', () => {
  it('renders the sandbox notice', () => {
    render(<TelehealthConsole />);
    expect(screen.getByTestId('telehealth-console-notice')).toBeInTheDocument();
  });

  it('shows disclosure text about prototype demo', () => {
    render(<TelehealthConsole />);
    expect(screen.getByText(/Sandbox Notice/i)).toBeInTheDocument();
    expect(screen.getByText(/prototype UI demonstration/i)).toBeInTheDocument();
  });
});
