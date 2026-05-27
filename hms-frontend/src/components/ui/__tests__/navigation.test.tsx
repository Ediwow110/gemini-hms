import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BackButton } from '../back-button';
import { Breadcrumbs } from '../breadcrumbs';
import { PageHeader } from '../page-header';

// Mock useNavigate and useLocation from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Navigation Components Tests', () => {
  describe('BackButton', () => {
    it('renders label correctly and handles fallback navigation', () => {
      render(
        <MemoryRouter>
          <BackButton label="Back to Dashboard" fallback="/dashboard" />
        </MemoryRouter>
      );

      const button = screen.getByRole('button', { name: /Go back to Back to Dashboard/i });
      expect(button).toBeInTheDocument();
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();

      fireEvent.click(button);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('navigates to returnTo search param if present', () => {
      render(
        <MemoryRouter initialEntries={['/profile?returnTo=/special-page']}>
          <BackButton label="Back" fallback="/dashboard" />
        </MemoryRouter>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(mockNavigate).toHaveBeenCalledWith('/special-page');
    });
  });

  describe('Breadcrumbs', () => {
    it('renders items and handles current status correctly', () => {
      const items = [
        { label: 'Home', to: '/' },
        { label: 'Settings', to: '/settings' },
        { label: 'Profile', current: true },
      ];

      render(
        <MemoryRouter>
          <Breadcrumbs items={items} />
        </MemoryRouter>
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      
      const currentItem = screen.getByText('Profile');
      expect(currentItem).toBeInTheDocument();
      expect(currentItem).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('PageHeader', () => {
    it('renders title and description backward-compatibly', () => {
      render(
        <MemoryRouter>
          <PageHeader title="My Test Title" description="My test description" />
        </MemoryRouter>
      );

      expect(screen.getByText('My Test Title')).toBeInTheDocument();
      expect(screen.getByText('My test description')).toBeInTheDocument();
    });

    it('renders breadcrumbs and back button when props are provided', () => {
      const items = [{ label: 'Home', to: '/' }, { label: 'Details', current: true }];
      render(
        <MemoryRouter>
          <PageHeader 
            title="Detail Page" 
            backFallback="/home" 
            backLabel="Go Back"
            breadcrumbs={items}
          />
        </MemoryRouter>
      );

      expect(screen.getByText('Detail Page')).toBeInTheDocument();
      expect(screen.getByText('Go Back')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });
});
