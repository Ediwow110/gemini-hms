import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BranchSettings } from '../BranchSettings';
import { DepartmentSettings } from '../DepartmentSettings';
import { ServiceSettings } from '../ServiceSettings';
import { NumberingSettings } from '../NumberingSettings';
import { TemplateSettings } from '../TemplateSettings';

const renderPage = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('Settings pages — sandbox disclosure (post-truth-alignment)', () => {
  describe('BranchSettings', () => {
    it('renders page title with explicit (Mock) suffix', () => {
      renderPage(<BranchSettings />);
      expect(screen.getByText('Branch Management (Mock)')).toBeInTheDocument();
    });

    it('renders body-level sandbox notice', () => {
      renderPage(<BranchSettings />);
      expect(screen.getByTestId('branch-settings-sandbox-notice')).toBeInTheDocument();
      expect(screen.getByText(/The branch rows, addresses, contact info, and operating hours shown below are mock placeholder data/i)).toBeInTheDocument();
    });

    it('renders honest audit footer', () => {
      renderPage(<BranchSettings />);
      expect(screen.getByText(/Mock branch management \(sandbox\)/i)).toBeInTheDocument();
    });

    it('disclosure explicitly states the branch names are fake', () => {
      renderPage(<BranchSettings />);
      expect(screen.getByText(/intentionally fake/i)).toBeInTheDocument();
    });
  });

  describe('DepartmentSettings', () => {
    it('renders page title with explicit (Mock) suffix', () => {
      renderPage(<DepartmentSettings />);
      expect(screen.getByText('Department Management (Mock)')).toBeInTheDocument();
    });

    it('renders body-level sandbox notice', () => {
      renderPage(<DepartmentSettings />);
      expect(screen.getByTestId('department-settings-sandbox-notice')).toBeInTheDocument();
      expect(screen.getByText(/The department rows, codes, and branch assignments shown below are mock placeholder data/i)).toBeInTheDocument();
    });

    it('renders honest audit footer', () => {
      renderPage(<DepartmentSettings />);
      expect(screen.getByText(/Mock department management \(sandbox\)/i)).toBeInTheDocument();
    });
  });

  describe('ServiceSettings', () => {
    it('renders page title with explicit (Mock) suffix', () => {
      renderPage(<ServiceSettings />);
      expect(screen.getByText('Services & Packages (Mock)')).toBeInTheDocument();
    });

    it('renders body-level sandbox notice', () => {
      renderPage(<ServiceSettings />);
      expect(screen.getByTestId('service-settings-sandbox-notice')).toBeInTheDocument();
      expect(screen.getByText(/The service rows, categories, prices, and branch assignments shown below are mock placeholder data/i)).toBeInTheDocument();
    });

    it('renders honest audit footer', () => {
      renderPage(<ServiceSettings />);
      expect(screen.getByText(/Mock service catalog \(sandbox\)/i)).toBeInTheDocument();
    });

    it('disclosure explicitly states the prices are placeholder', () => {
      renderPage(<ServiceSettings />);
      expect(screen.getByText(/placeholder values, not live pricing/i)).toBeInTheDocument();
    });
  });

  describe('NumberingSettings', () => {
    it('renders page title with explicit (Mock) suffix', () => {
      renderPage(<NumberingSettings />);
      expect(screen.getByText('Numbering Rules (Mock)')).toBeInTheDocument();
    });

    it('renders body-level sandbox notice', () => {
      renderPage(<NumberingSettings />);
      expect(screen.getByTestId('numbering-settings-sandbox-notice')).toBeInTheDocument();
      expect(screen.getByText(/The numbering rules and .Next Number Preview. values shown below are mock placeholder data/i)).toBeInTheDocument();
    });

    it('renders honest audit footer', () => {
      renderPage(<NumberingSettings />);
      expect(screen.getByText(/Mock numbering rules \(sandbox\)/i)).toBeInTheDocument();
    });

    it('disclosure explicitly states the preview values are illustrative', () => {
      renderPage(<NumberingSettings />);
      expect(screen.getByText(/illustrative only/i)).toBeInTheDocument();
    });
  });

  describe('TemplateSettings', () => {
    it('renders page title with explicit (Mock) suffix', () => {
      renderPage(<TemplateSettings />);
      expect(screen.getByText('Print Templates (Mock)')).toBeInTheDocument();
    });

    it('renders body-level sandbox notice', () => {
      renderPage(<TemplateSettings />);
      expect(screen.getByTestId('template-settings-sandbox-notice')).toBeInTheDocument();
      expect(screen.getByText(/The template rows, types, version numbers, and last-updated dates shown below are mock placeholder data/i)).toBeInTheDocument();
    });

    it('renders honest audit footer', () => {
      renderPage(<TemplateSettings />);
      expect(screen.getByText(/Mock print templates \(sandbox\)/i)).toBeInTheDocument();
    });
  });
});
