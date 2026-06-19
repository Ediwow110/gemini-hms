import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BranchSettings } from '../BranchSettings';
import { DepartmentSettings } from '../DepartmentSettings';
import { ServiceSettings } from '../ServiceSettings';
import { NumberingSettings } from '../NumberingSettings';
import { TemplateSettings } from '../TemplateSettings';

const renderPage = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('Settings pages — honest prototype disclosure (post-100% fix)', () => {
  describe('BranchSettings', () => {
    it('renders page title without misleading (Mock) suffix', () => {
      renderPage(<BranchSettings />);
      expect(screen.getByText('Branch Management')).toBeInTheDocument();
      expect(screen.queryByText(/\(Mock\)/i)).not.toBeInTheDocument();
    });

    it('does not render body-level sandbox notice', () => {
      renderPage(<BranchSettings />);
      expect(screen.queryByTestId('branch-settings-sandbox-notice')).not.toBeInTheDocument();
    });

    it('renders honest audit footer indicating prototype', () => {
      renderPage(<BranchSettings />);
      expect(screen.getByText(/UI prototype - not persisted/i)).toBeInTheDocument();
    });
  });

  describe('DepartmentSettings', () => {
    it('renders page title without misleading (Mock) suffix', () => {
      renderPage(<DepartmentSettings />);
      expect(screen.getByText('Department Management')).toBeInTheDocument();
      expect(screen.queryByText(/\(Mock\)/i)).not.toBeInTheDocument();
    });

    it('does not render body-level sandbox notice', () => {
      renderPage(<DepartmentSettings />);
      expect(screen.queryByTestId('department-settings-sandbox-notice')).not.toBeInTheDocument();
    });

    it('renders honest audit footer indicating prototype', () => {
      renderPage(<DepartmentSettings />);
      expect(screen.getByText(/UI prototype - not persisted/i)).toBeInTheDocument();
    });
  });

  describe('ServiceSettings', () => {
    it('renders page title without misleading (Mock) suffix', () => {
      renderPage(<ServiceSettings />);
      expect(screen.getByText('Services & Packages')).toBeInTheDocument();
      expect(screen.queryByText(/\(Mock\)/i)).not.toBeInTheDocument();
    });

    it('does not render body-level sandbox notice', () => {
      renderPage(<ServiceSettings />);
      expect(screen.queryByTestId('service-settings-sandbox-notice')).not.toBeInTheDocument();
    });

    it('renders honest audit footer indicating prototype', () => {
      renderPage(<ServiceSettings />);
      expect(screen.getByText(/UI prototype - not persisted/i)).toBeInTheDocument();
    });
  });

  describe('NumberingSettings', () => {
    it('renders page title without misleading (Mock) suffix', () => {
      renderPage(<NumberingSettings />);
      expect(screen.getByText('Numbering Rules')).toBeInTheDocument();
      expect(screen.queryByText(/\(Mock\)/i)).not.toBeInTheDocument();
    });

    it('does not render body-level sandbox notice', () => {
      renderPage(<NumberingSettings />);
      expect(screen.queryByTestId('numbering-settings-sandbox-notice')).not.toBeInTheDocument();
    });

    it('renders honest audit footer indicating prototype', () => {
      renderPage(<NumberingSettings />);
      expect(screen.getByText(/UI prototype - not persisted/i)).toBeInTheDocument();
    });
  });

  describe('TemplateSettings', () => {
    it('renders page title without misleading (Mock) suffix', () => {
      renderPage(<TemplateSettings />);
      expect(screen.getByText('Print Templates')).toBeInTheDocument();
      expect(screen.queryByText(/\(Mock\)/i)).not.toBeInTheDocument();
    });

    it('does not render body-level sandbox notice', () => {
      renderPage(<TemplateSettings />);
      expect(screen.queryByTestId('template-settings-sandbox-notice')).not.toBeInTheDocument();
    });

    it('renders honest audit footer indicating prototype', () => {
      renderPage(<TemplateSettings />);
      expect(screen.getByText(/UI prototype - not persisted/i)).toBeInTheDocument();
    });
  });
});
