import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ResultValidationPage } from '../ResultValidationPage';
import { MemoryRouter } from 'react-router-dom';
import { useLabDraftEncodingContext, useValidateLabResult, useParameterDefinitions } from '../../../hooks/use-clinical-workflow';

vi.mock('../../../hooks/use-clinical-workflow', () => ({
  useLabDraftEncodingContext: vi.fn(),
  useValidateLabResult: vi.fn(),
  useParameterDefinitions: vi.fn(),
}));

describe('ResultValidationPage Unit Tests', () => {
  const mockContext = {
    orderId: 'order-123',
    orderNumber: 'ORD-2026-001',
    orderStatus: 'ENCODED',
    patientId: 'patient-456',
    patientName: 'Jane Smith',
    patientNumber: 'MRN-456',
    dob: new Date('1990-05-15'),
    panelName: 'Complete Blood Count',
    specimenId: 'specimen-789',
    specimenType: 'Blood',
    accessionNumber: 'ACC-789',
    collectionMode: 'VENIPUNCTURE',
    receivedAt: new Date(),
    draftResults: {
      Hemoglobin: '14.2',
      WBC: '7.5',
    },
    testItems: [
      { itemName: 'Hemoglobin' },
      { itemName: 'WBC' },
    ],
    draftVersion: 1,
    draftRemarks: 'Slightly lipemic sample',
    draftLastEditedById: 'medtech-1',
    draftLastEditedAt: new Date(),
    requestedById: 'doctor-1',
  };

  const mockValidateMutateAsync = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useLabDraftEncodingContext).mockReturnValue({
      data: mockContext,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    vi.mocked(useValidateLabResult).mockReturnValue({
      mutateAsync: mockValidateMutateAsync,
      isPending: false,
      isError: false,
      error: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    vi.mocked(useParameterDefinitions).mockReturnValue({
      data: [
        {
          parameterName: 'Hemoglobin',
          code: 'HGB',
          unit: 'g/dL',
          referenceRangeText: '12.0 - 16.0',
          minNormal: 12.0,
          maxNormal: 16.0,
          valueType: 'NUMERIC',
          isRequired: true,
          displayOrder: 1,
        },
        {
          parameterName: 'WBC',
          code: 'WBC',
          unit: 'x10^9/L',
          referenceRangeText: '4.5 - 11.0',
          minNormal: 4.5,
          maxNormal: 11.0,
          valueType: 'NUMERIC',
          isRequired: true,
          displayOrder: 2,
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  it('renders safety bar, order metadata, and encoded parameter list', () => {
    render(
      <MemoryRouter initialEntries={['/lab/validate?patientId=patient-456&orderId=order-123']}>
        <ResultValidationPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('MRN: MRN-456')).toBeInTheDocument();
    expect(screen.getByText('Pending Verification: Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('Hemoglobin')).toBeInTheDocument();
    expect(screen.getByText('14.2')).toBeInTheDocument();
    expect(screen.getByText('WBC')).toBeInTheDocument();
    expect(screen.getByText('7.5')).toBeInTheDocument();
    expect(screen.getByText('"Slightly lipemic sample"')).toBeInTheDocument();
  });

  it('submits validation approval when approve button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/lab/validate?patientId=patient-456&orderId=order-123']}>
        <ResultValidationPage />
      </MemoryRouter>
    );

    const approveButton = screen.getByRole('button', { name: /Approve & Sign Assay/i });
    fireEvent.click(approveButton);

    expect(mockValidateMutateAsync).toHaveBeenCalledWith({
      patientId: 'patient-456',
      orderId: 'order-123',
      data: { version: 1 },
    });
  });

  it('shows unit and reference range from parameter definitions', () => {
    render(
      <MemoryRouter initialEntries={['/lab/validate?patientId=patient-456&orderId=order-123']}>
        <ResultValidationPage />
      </MemoryRouter>
    );

    expect(screen.getByText('g/dL')).toBeInTheDocument();
    expect(screen.getByText('12.0 - 16.0')).toBeInTheDocument();
    expect(screen.getByText('x10^9/L')).toBeInTheDocument();
    expect(screen.getByText('4.5 - 11.0')).toBeInTheDocument();
  });

  it('shows honest WIP message instead of faking reject submission', () => {
    render(
      <MemoryRouter initialEntries={['/lab/validate?patientId=patient-456&orderId=order-123']}>
        <ResultValidationPage />
      </MemoryRouter>
    );

    const rejectButton = screen.getByRole('button', { name: /Reject & Return to Encoder/i });
    fireEvent.click(rejectButton);

    expect(screen.getByPlaceholderText(/Explain what parameters need review/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Return to Entry Desk/i })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Explain what parameters need review/i), {
      target: { value: 'Hemoglobin value seems too high' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Return to Entry Desk/i }));

    expect(screen.getByText(/Return-to-Encoder requires backend API support/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dismiss/i })).toBeInTheDocument();
  });
});
