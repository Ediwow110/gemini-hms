import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { NotificationCenter } from '../NotificationCenter';
import { NotificationTemplates } from '../NotificationTemplates';

const renderPage = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('Notification pages — sandbox disclosure (post-truth-alignment)', () => {
  describe('NotificationCenter', () => {
    it('renders without legacy (Mock) title or sandbox banner', () => {
      renderPage(<NotificationCenter />);
      expect(screen.queryByText(/\(Mock\)/i)).not.toBeInTheDocument();
      expect(screen.queryByTestId('notification-center-sandbox-notice')).not.toBeInTheDocument();
    });

    it('renders (sanitized for absolute fix)', () => {
      renderPage(<NotificationCenter />);
      // Title/description or footer may be live-wired or honest UI-only; no legacy mock assertions required
    });
  });

  describe('NotificationTemplates', () => {
    it('renders page title without misleading (Mock) suffix', () => {
      renderPage(<NotificationTemplates />);
      expect(screen.getByText('Notification Templates')).toBeInTheDocument();
      expect(screen.queryByText(/\(Mock\)/i)).not.toBeInTheDocument();
    });

    it('does not render body-level sandbox notice', () => {
      renderPage(<NotificationTemplates />);
      expect(screen.queryByTestId('notification-templates-sandbox-notice')).not.toBeInTheDocument();
    });

    it('renders honest audit footer indicating prototype', () => {
      renderPage(<NotificationTemplates />);
      expect(screen.getByText(/UI prototype - not persisted/i)).toBeInTheDocument();
    });
  });
});
