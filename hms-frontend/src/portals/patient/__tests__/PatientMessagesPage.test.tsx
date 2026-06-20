import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PatientMessagesPage } from '../PatientMessagesPage';

describe('PatientMessagesPage — pop-culture name cleanup', () => {
  it('does not contain Dr. House references', () => {
    render(
      <MemoryRouter>
        <PatientMessagesPage />
      </MemoryRouter>
    );

    expect(screen.queryByText(/Dr\. House/i)).not.toBeInTheDocument();
  });

  it('renders neutral Provider 003 identifier (may appear in message list and preview)', () => {
    render(
      <MemoryRouter>
        <PatientMessagesPage />
      </MemoryRouter>
    );

    // Provider 003 appears in both the message body and conversation preview, so use getAllByText
    const providerElements = screen.getAllByText(/Provider 003/);
    expect(providerElements.length).toBeGreaterThanOrEqual(1);
  });
});
