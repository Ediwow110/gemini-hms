import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ResultEncodingPage } from '../ResultEncodingPage';
import { MemoryRouter } from 'react-router-dom';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type {
  LabResultDraftContextDto,
  LabParameterDefinitionDto,
  SaveDraftLabResultPayload,
  LabResultDraftSummaryDto,
} from '../../../services/clinicalWorkflow.service';

// Mock router params to provide patientId and orderId
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ patientId: 'patient-1', orderId: 'order-1' }),
  };
});

// Mock clinical workflow hooks
vi.mock('../../../hooks/use-clinical-workflow', () => ({
  useLabDraftEncodingContext: vi.fn(),
  useParameterDefinitions: vi.fn(),
  useSaveDraftLabResult: vi.fn(),
}));

import { useLabDraftEncodingContext, useParameterDefinitions, useSaveDraftLabResult } from '../../../hooks/use-clinical-workflow';

const mockContext: Partial<LabResultDraftContextDto> = {
  orderId: 'order-1',
  orderNumber: 'ORD-12345',
  orderStatus: 'ENCODED',
  patientId: 'patient-1',
  patientName: 'John Doe',
  patientNumber: 'MRN-67890',
  dob: new Date('1985-01-01'),
  panelName: 'Complete Blood Count',
  testItems: [],
  specimenId: 'specimen-1',
  specimenType: 'Blood',
  collectionMode: 'VENIPUNCTURE',
  receivedAt: new Date(),
  draftStatus: 'DRAFT',
  draftVersion: 1,
  draftResults: { Hemoglobin: '13.5' },
  draftRemarks: 'Initial draft',
  draftLastEditedById: 'medtech-1',
  draftLastEditedAt: new Date(),
  requestedById: 'doctor-1',
  timestamp: new Date(),
  accessLabel: 'test',
  isReadOnly: false,
};

const mockDefinitions: LabParameterDefinitionDto[] = [
  {
    code: 'Hemoglobin',
    parameterName: 'Hemoglobin',
    unit: 'g/dL',
    referenceRangeText: '12-16',
    minNormal: 12,
    maxNormal: 16,
    minCritical: 6,
    maxCritical: 20,
    valueType: 'numeric',
    isRequired: true,
    displayOrder: 1,
  },
];

describe('ResultEncodingPage Unit Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default successful data mocks
    vi.mocked(useLabDraftEncodingContext).mockReturnValue({
      data: mockContext as LabResultDraftContextDto,
      isLoading: false,
      isError: false,
    } as unknown as UseQueryResult<LabResultDraftContextDto, Error>);
    vi.mocked(useParameterDefinitions).mockReturnValue({
      data: mockDefinitions,
      isLoading: false,
      isError: false,
    } as unknown as UseQueryResult<LabParameterDefinitionDto[], Error>);
    vi.mocked(useSaveDraftLabResult).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as unknown as UseMutationResult<LabResultDraftSummaryDto, Error, { patientId: string; orderId: string; data: SaveDraftLabResultPayload }, unknown>);
  });

  it('shows loading skeleton while context is loading', () => {
    vi.mocked(useLabDraftEncodingContext).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as UseQueryResult<LabResultDraftContextDto, Error>);
    render(
      <MemoryRouter>
        <ResultEncodingPage />
      </MemoryRouter>
    );
    // The loading skeleton contains elements with the animate-shimmer class
    const shimmer = document.querySelector('.animate-shimmer');
    expect(shimmer).toBeInTheDocument();
    // Patient name should not be rendered yet
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('shows data-unavailable UI on error state', () => {
    vi.mocked(useLabDraftEncodingContext).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network'),
    } as unknown as UseQueryResult<LabResultDraftContextDto, Error>);
    render(
      <MemoryRouter>
        <ResultEncodingPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Encoding Context — data not available yet/i)).toBeInTheDocument();
  });

  it('renders context data and allows draft save', async () => {
    render(
      <MemoryRouter>
        <ResultEncodingPage />
      </MemoryRouter>
    );
    // Wait for patient name to appear (context loaded)
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());
    // Parameter row should be rendered
    expect(screen.getByText('Hemoglobin')).toBeInTheDocument();
    // The draft remarks textarea should contain the initial remark
    const remarks = screen.getByPlaceholderText(/Log any sample anomalies/i) as HTMLTextAreaElement;
    expect(remarks).toBeInTheDocument();
    expect(remarks.value).toBe('Initial draft');
    // Click Save Draft button
    const saveButton = screen.getByRole('button', { name: /Save Draft/i });
    fireEvent.click(saveButton);
    // Ensure mutate was called with expected payload
    const mockMutate = vi.mocked(useSaveDraftLabResult).mock.results[0].value.mutate;
    expect(mockMutate).toHaveBeenCalled();
    const calledWith = mockMutate.mock.calls[0][0];
    expect(calledWith).toMatchObject({
      patientId: 'patient-1',
      orderId: 'order-1',
      data: expect.objectContaining({
        results: expect.any(Object),
        remarks: 'Initial draft',
      }),
    });
    // Manually trigger the onSuccess callback to verify banner
    const options = mockMutate.mock.calls[0][1];
    if (options && options.onSuccess) {
      options.onSuccess();
    }
    await waitFor(() => expect(screen.getByText(/Draft saved successfully/i)).toBeInTheDocument());
  });
});
