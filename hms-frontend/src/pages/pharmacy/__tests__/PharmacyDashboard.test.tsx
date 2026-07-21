import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PharmacyDashboard } from '../PharmacyDashboard';
import type { PharmacyPrescriptionQueueDto, DrugStockDto, LowStockAlertDto } from '../../../services/pharmacy.service';

const mockUsePrescriptionQueue = vi.hoisted(() => vi.fn());
const mockUseDrugCatalog = vi.hoisted(() => vi.fn());
const mockUseLowStockAlerts = vi.hoisted(() => vi.fn());

vi.mock('../../../hooks/use-pharmacy', () => ({
  usePrescriptionQueue: () => mockUsePrescriptionQueue(),
  useDrugCatalog: () => mockUseDrugCatalog(),
  useLowStockAlerts: () => mockUseLowStockAlerts(),
}));

const mockHasPermission = vi.hoisted(() => vi.fn<(permission: string) => boolean>(() => true));

vi.mock('../../../hooks/use-user', () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const sampleQueueItem = (overrides?: Partial<PharmacyPrescriptionQueueDto>): PharmacyPrescriptionQueueDto => ({
  id: 'rx-1',
  encounterId: 'enc-1',
  patientId: 'pat-1',
  patientName: 'Patient 001',
  patientNumber: 'P-001',
  medicationName: 'Amoxicillin',
  dosage: '500mg',
  frequency: 'BID',
  duration: '7 days',
  status: 'PENDING',
  version: 1,
  prescribedAt: new Date('2026-06-26'),
  prescribedBy: 'provider-1',
  prescribedByName: 'Provider 001',
  timestamp: new Date('2026-06-26'),
  accessLabel: 'PUBLIC',
  isReadOnly: false,
  ...overrides,
});

const sampleDrug = (overrides?: Partial<DrugStockDto>): DrugStockDto => ({
  id: 'drug-1',
  name: 'Amoxicillin',
  sku: 'AMX-500',
  type: 'ANTIBIOTIC',
  quantity: 50,
  reorderLevel: 10,
  unit: 'capsules',
  ...overrides,
});

const sampleLowStockAlert = (overrides?: Partial<LowStockAlertDto>): LowStockAlertDto => ({
  id: 'alert-1',
  inventoryItemId: 'drug-1',
  quantity: 5,
  reorderLevel: 10,
  inventoryItem: { name: 'Amoxicillin', sku: 'AMX-500', unit: 'capsules' },
  ...overrides,
});

describe('PharmacyDashboard Unit Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockHasPermission.mockReturnValue(true);
  });

  it('renders successfully with live dashboard data', async () => {
    mockUsePrescriptionQueue.mockReturnValue({ data: [sampleQueueItem()], isLoading: false, error: null });
    mockUseDrugCatalog.mockReturnValue({ data: [sampleDrug()], isLoading: false, error: null });
    mockUseLowStockAlerts.mockReturnValue({ data: [sampleLowStockAlert()], isLoading: false, error: null });

    render(
      <MemoryRouter>
        <PharmacyDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pharmacy Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Inventory')).toBeInTheDocument();
      expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText(/Live source unavailable/i)).not.toBeInTheDocument();
    });
  });

  it('shows loading skeleton when data is loading', async () => {
    mockUsePrescriptionQueue.mockReturnValue({ data: undefined, isLoading: true, error: null });
    mockUseDrugCatalog.mockReturnValue({ data: undefined, isLoading: true, error: null });
    mockUseLowStockAlerts.mockReturnValue({ data: undefined, isLoading: true, error: null });

    render(
      <MemoryRouter>
        <PharmacyDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pharmacy Dashboard')).toBeInTheDocument();
    });
  });

  it('shows error state when API fails', async () => {
    mockUsePrescriptionQueue.mockReturnValue({ data: undefined, isLoading: false, error: new Error('Network error') });
    mockUseDrugCatalog.mockReturnValue({ data: undefined, isLoading: false, error: null });
    mockUseLowStockAlerts.mockReturnValue({ data: undefined, isLoading: false, error: null });

    render(
      <MemoryRouter>
        <PharmacyDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load pharmacy dashboard data/i)).toBeInTheDocument();
    });
  });

  it('shows HmsDataUnavailable sections when data is empty', async () => {
    mockUsePrescriptionQueue.mockReturnValue({ data: [], isLoading: false, error: null });
    mockUseDrugCatalog.mockReturnValue({ data: [], isLoading: false, error: null });
    mockUseLowStockAlerts.mockReturnValue({ data: [], isLoading: false, error: null });

    render(
      <MemoryRouter>
        <PharmacyDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pharmacy Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Prescriptions Waiting Dispense/)).toBeInTheDocument();
      expect(screen.getByText(/Lowest Stock Items/)).toBeInTheDocument();
    });
  });

  it('hides dispense hub shortcuts from users without dispense permission', async () => {
    mockHasPermission.mockImplementation((permission: string) => permission !== 'inventory.stock.dispense');
    mockUsePrescriptionQueue.mockReturnValue({ data: [sampleQueueItem()], isLoading: false, error: null });
    mockUseDrugCatalog.mockReturnValue({ data: [sampleDrug()], isLoading: false, error: null });
    mockUseLowStockAlerts.mockReturnValue({ data: [], isLoading: false, error: null });

    render(
      <MemoryRouter>
        <PharmacyDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Prescriptions Waiting Dispense')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /Dispense →/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Dispense Queue' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Drug Inventory' })).not.toBeInTheDocument();
    expect(screen.queryByText('Open Dispense Hub')).not.toBeInTheDocument();
    expect(screen.queryByText('Open Inventory Manager')).not.toBeInTheDocument();
    expect(screen.getByText('Dispense Queue Backlog')).toBeInTheDocument();
    expect(mockHasPermission).toHaveBeenCalledWith('inventory.stock.dispense');
  });

  it('allows navigating to dispense hub only when dispense permission is present', async () => {
    mockHasPermission.mockReturnValue(true);
    mockUsePrescriptionQueue.mockReturnValue({ data: [sampleQueueItem()], isLoading: false, error: null });
    mockUseDrugCatalog.mockReturnValue({ data: [sampleDrug()], isLoading: false, error: null });
    mockUseLowStockAlerts.mockReturnValue({ data: [], isLoading: false, error: null });

    render(
      <MemoryRouter>
        <PharmacyDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Dispense Queue' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Dispense →/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/pharmacy');

    expect(
      screen.getByRole('link', { name: 'Dispense Queue' }),
    ).toHaveAttribute('href', '/pharmacy');
  });
});
