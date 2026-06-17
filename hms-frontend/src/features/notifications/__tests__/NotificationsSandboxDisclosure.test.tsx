import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { NotificationCenter } from '../NotificationCenter';
import { NotificationTemplates } from '../NotificationTemplates';

const renderPage = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('Notification pages — sandbox disclosure (post-truth-alignment)', () => {
  describe('NotificationCenter', () => {
    it('renders page title with explicit (Mock) suffix', () => {
      renderPage(<NotificationCenter />);
      expect(screen.getByText('Notification Center (Mock)')).toBeInTheDocument();
    });

    it('renders body-level sandbox notice', () => {
      renderPage(<NotificationCenter />);
      expect(screen.getByTestId('notification-center-sandbox-notice')).toBeInTheDocument();
      expect(screen.getByText(/The stat counters and notification rows shown below are mock placeholder data/i)).toBeInTheDocument();
    });

    it('renders honest audit footer', () => {
      renderPage(<NotificationCenter />);
      expect(screen.getByText(/Mock notification log \(sandbox\)/i)).toBeInTheDocument();
    });

    it('disclosure explicitly states notification subjects are illustrative', () => {
      renderPage(<NotificationCenter />);
      expect(screen.getByText(/notification subjects, recipients, error messages, and timestamps are illustrative/i)).toBeInTheDocument();
    });
  });

  describe('NotificationTemplates', () => {
    it('renders page title with explicit (Mock) suffix', () => {
      renderPage(<NotificationTemplates />);
      expect(screen.getByText('Notification Templates (Mock)')).toBeInTheDocument();
    });

    it('renders body-level sandbox notice', () => {
      renderPage(<NotificationTemplates />);
      expect(screen.getByTestId('notification-templates-sandbox-notice')).toBeInTheDocument();
      expect(screen.getByText(/The template rows, channels, subjects, and privacy classifications shown below are mock placeholder data/i)).toBeInTheDocument();
    });

    it('renders honest audit footer', () => {
      renderPage(<NotificationTemplates />);
      expect(screen.getByText(/Mock notification templates \(sandbox\)/i)).toBeInTheDocument();
    });
  });
});
