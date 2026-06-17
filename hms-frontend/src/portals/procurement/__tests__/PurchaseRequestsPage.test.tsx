import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PurchaseRequestsPage } from '../PurchaseRequestsPage';

describe('PurchaseRequestsPage — pop-culture name cleanup', () => {
  it('does not contain pop-culture requester names (Dr. House, Nurse Hopps, Dr. Chase)', () => {
    render(
      <MemoryRouter>
        <PurchaseRequestsPage />
      </MemoryRouter>
    );

    expect(screen.queryByText(/Dr\. House/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Nurse Hopps/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dr\. Chase/i)).not.toBeInTheDocument();
  });

  it('renders neutral Requester 001/002/003 identifiers', () => {
    render(
      <MemoryRouter>
        <PurchaseRequestsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Requester 001/)).toBeInTheDocument();
    expect(screen.getByText(/Requester 002/)).toBeInTheDocument();
    expect(screen.getByText(/Requester 003/)).toBeInTheDocument();
  });
});
