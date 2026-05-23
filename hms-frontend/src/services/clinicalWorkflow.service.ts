import { apiClient } from '../lib/api';
import type { AxiosResponse } from 'axios';

// DTOs matching backend definitions
export interface ClinicalWorkQueueDto {
  id: string;
  patientId: string;
  patientName: string;
  patientNumber: string;
  queueNumber: string;
  category: string; // REGULAR, PRIORITY, EMERGENCY
  serviceType: string; // RECEPTION, CASHIER, LABORATORY, DOCTOR
  status: string; // WAITING, CALLING, SERVING, COMPLETED, CANCELLED
  waitTimeMinutes: number;
  timestamp: Date;
  branchId: string;
  tenantId: string;
  accessLabel: string;
  isReadOnly: boolean;
}

export interface PatientClinicalSummaryDto {
  id: string;
  patientId: string;
  patientName: string;
  patientNumber: string;
  dob: Date;
  gender?: string;
  recentEncounters: number;
  activePrescriptions: number;
  pendingLabResults: number;
  bloodType?: string;
  allergies?: string[];
  status: string;
  timestamp: Date;
  accessLabel: string;
  isReadOnly: boolean;
}

export interface EncounterSummaryDto {
  id: string;
  patientId: string;
  doctorId?: string;
  doctorName?: string;
  encounteredAt: Date;
  timestamp: Date;
  type: string;
  status: string;
  chiefComplaint: string;
  diagnosis?: string;
  hasNotes: boolean;
  branchId: string;
  tenantId: string;
  accessLabel: string;
  isReadOnly: boolean;
}

export interface VitalsSummaryDto {
  id: string;
  encounterId: string;
  patientId: string;
  temperature?: number;
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  respiratoryRate?: number;
  weightKg?: number;
  recordedAt: Date;
  timestamp: Date;
  status: string;
  recordedBy?: string;
  accessLabel: string;
  isReadOnly: boolean;
}

export interface ClinicalOrderSummaryDto {
  id: string;
  orderNumber: string;
  patientId: string;
  status: string;
  itemCount: number;
  orderType: string;
  cancelledReason?: string;
  cancelledById?: string;
  cancelledAt?: Date;
  createdAt: Date;
  timestamp: Date;
  accessLabel: string;
  isReadOnly: boolean;
}

export interface ClinicalOrderItemSummaryDto {
  id: string;
  itemName: string;
  notes: string | null;
  status: string;
  createdAt: Date;
}

export interface LabResultSummaryDto {
  id: string;
  orderId: string;
  orderNumber: string;
  patientId: string;
  status: string;
  isReleased: boolean;
  releasedAt?: Date;
  timestamp: Date;
  approvedBy?: string;
  accessLabel: string;
  isReadOnly: boolean;
}

export interface PrescriptionSummaryDto {
  id: string;
  encounterId: string;
  patientId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  status: string;
  prescribedAt: Date;
  timestamp: Date;
  prescribedBy: string;
  accessLabel: string;
  isReadOnly: boolean;
}

export interface BillingHandoffSummaryDto {
  id: string;
  orderId: string;
  orderNumber: string;
  patientId: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
  timestamp: Date;
  accessLabel: string;
  isReadOnly: boolean;
}

export interface SaveVitalsPayload {
  systolicBp?: number;
  diastolicBp?: number;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
}

export interface SaveTriagePayload {
  acuityLevel?: string;
  chiefComplaintSummary?: string;
  arrivalMode?: string;
  painScore?: number;
  infectiousRiskFlag?: boolean;
  fallRiskFlag?: boolean;
  pregnancyFlag?: boolean;
  notes?: string;
}

export interface TriageSummaryDto {
  id: string;
  patientId: string;
  encounterId?: string;
  queueEntryId?: string;
  acuityLevel?: string;
  chiefComplaintSummary?: string;
  arrivalMode?: string;
  painScore?: number;
  infectiousRiskFlag: boolean;
  fallRiskFlag: boolean;
  pregnancyFlag: boolean;
  notes?: string;
  status: string;
  recordedAt: Date;
  timestamp: Date;
  recordedBy: string;
  accessLabel: string;
  isReadOnly: boolean;
}

export interface ClinicalDashboardSummaryDto {
  branchId: string;
  activePatients: number;
  pendingTriage: number;
  waitingForDoctor: number;
  pendingLabResults: number;
  completedEncountersToday: number;
  timestamp: Date;
  accessLabel: string;
  isReadOnly: boolean;
}

export interface CreateClinicalOrderItem {
  itemName: string;
  catalogCode?: string;
  notes?: string;
}

export interface CancelClinicalOrderPayload {
  reason: string;
}

export interface ReceiveLabOrderPayload {
  specimenType: string;
  accessionNumber?: string;
  collectionMode?: string;
}

export interface SaveDraftLabResultPayload {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  results: Record<string, any>;
  remarks?: string;
}

export interface ValidateLabResultPayload {
  version: number;
  remarks?: string;
}

export interface ReleaseLabResultPayload {
  version: number;
}

export interface ReleasedResultSummaryDto {
  id: string;
  orderId: string;
  status: string;
  version: number;
  results?: Record<string, string | number | boolean | null>;
  remarks?: string;
  validatedById?: string;
  validatedAt?: Date;
  releasedById?: string;
  releasedAt?: Date;
  createdAt: Date;
  timestamp: Date;
  accessLabel: string;
  isReadOnly: boolean;
}

export interface LabValidationSummaryDto {
  id: string;
  orderId: string;
  status: string;
  version: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  results?: Record<string, any>;
  remarks?: string;
  encodedById?: string;
  encodedAt?: Date;
  validatedById?: string;
  validatedAt?: Date;
  createdAt: Date;
  timestamp: Date;
  accessLabel: string;
  isReadOnly: boolean;
}

export interface LabResultDraftSummaryDto {
  id: string;
  orderId: string;
  status: string;
  version: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  results?: Record<string, any>;
  remarks?: string;
  encodedById?: string;
  encodedAt?: Date;
  lastEditedById?: string;
  lastEditedAt?: Date;
  createdAt: Date;
  timestamp: Date;
  accessLabel: string;
  isReadOnly: boolean;
}

export interface LabParameterDefinitionDto {
  parameterName: string;
  code: string;
  unit?: string;
  referenceRangeText?: string;
  minNormal?: number;
  maxNormal?: number;
  minCritical?: number;
  maxCritical?: number;
  valueType: string;
  allowedValues?: string;
  isRequired: boolean;
  displayOrder: number;
}

export interface LabTestDefinitionSummaryDto {
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  timestamp: Date;
  accessLabel: string;
  isReadOnly: boolean;
}

export interface LabResultDraftContextDto {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  orderPriority?: string;
  patientId: string;
  patientName: string;
  patientNumber: string;
  dob: Date;
  panelName?: string;
  testItems: ClinicalOrderItemSummaryDto[];
  specimenId: string;
  specimenType: string;
  accessionNumber?: string;
  collectionMode: string;
  receivedAt: Date;
  draftResultId?: string;
  draftStatus?: string;
  draftVersion?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  draftResults?: Record<string, any>;
  draftRemarks?: string;
  draftLastEditedById?: string;
  draftLastEditedAt?: Date;
  requestedById?: string;
  requestedAt?: Date;
  encounterId?: string;
  priority?: string;
  timestamp: Date;
  accessLabel: string;
  isReadOnly: boolean;
}

export interface ReleasedResultQueueDto {
  id: string;
  orderId: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientNumber: string;
  specimenId: string;
  specimenType: string;
  accessionNumber?: string;
  panelName?: string;
  validatedAt: Date;
  validatedById?: string;
  releasedAt: Date;
  releasedById?: string;
  version: number;
  status: string;
  timestamp: Date;
  accessLabel: string;
  isReadOnly: boolean;
}

export interface ValidatedResultSummaryDto {
  id: string;
  orderId: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientNumber: string;
  specimenId: string;
  specimenType: string;
  accessionNumber?: string;
  panelName?: string;
  validatedAt: Date;
  validatedById?: string;
  version: number;
  status: string;
  timestamp: Date;
  accessLabel: string;
  isReadOnly: boolean;
}

export interface LabSpecimenSummaryDto {
  id: string;
  orderId: string;
  specimenType: string;
  accessionNumber?: string;
  collectionMode: string;
  collectedAt?: Date;
  receivedAt: Date;
  receivedById: string;
  status: string;
  createdAt: Date;
  timestamp: Date;
  accessLabel: string;
  isReadOnly: boolean;
}

export interface CreateClinicalOrderPayload {
  orderType: 'LAB' | 'IMAGING' | 'PROCEDURE' | 'SERVICE';
  priority?: 'ROUTINE' | 'URGENT' | 'STAT';
  clinicalIndication?: string;
  items: CreateClinicalOrderItem[];
}

export interface SaveDraftSoapPayload {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

export interface ClinicalOrderCreatedDto {
  id: string;
  orderNumber: string;
  patientId: string;
  status: string;
  itemCount: number;
  orderType: string;
  createdAt: Date;
  timestamp: Date;
  accessLabel: string;
  isReadOnly: boolean;
}

export interface SoapDraftSummaryDto {
  id: string;
  encounterId: string;
  patientId: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  noteType: string;
  status: string;
  lockedAt?: Date | string;
  lockedBy?: string;
  recordedAt: Date | string;
  timestamp: Date | string;
  recordedBy: string;
  accessLabel: string;
  isReadOnly: boolean;
}

export const clinicalWorkflowService = {
  getWorkQueue: async (branchId?: string): Promise<ClinicalWorkQueueDto[]> => {
    const params = branchId ? { branchId } : {};
    const response: AxiosResponse<ClinicalWorkQueueDto[]> = await apiClient.get('/v1/clinical-workflow/work-queue', { params });
    return response.data;
  },

  getPatientSummary: async (patientId: string): Promise<PatientClinicalSummaryDto | null> => {
    const response: AxiosResponse<PatientClinicalSummaryDto | null> = await apiClient.get(`/v1/clinical-workflow/patients/${patientId}/summary`);
    return response.data;
  },

  getEncounters: async (patientId: string): Promise<EncounterSummaryDto[]> => {
    const response: AxiosResponse<EncounterSummaryDto[]> = await apiClient.get(`/v1/clinical-workflow/patients/${patientId}/encounters`);
    return response.data;
  },

  getVitals: async (patientId: string): Promise<VitalsSummaryDto[]> => {
    const response: AxiosResponse<VitalsSummaryDto[]> = await apiClient.get(`/v1/clinical-workflow/patients/${patientId}/vitals`);
    return response.data;
  },

  getOrders: async (patientId: string): Promise<ClinicalOrderSummaryDto[]> => {
    const response: AxiosResponse<ClinicalOrderSummaryDto[]> = await apiClient.get(`/v1/clinical-workflow/patients/${patientId}/orders`);
    return response.data;
  },

  getLabResults: async (patientId: string): Promise<LabResultSummaryDto[]> => {
    const response: AxiosResponse<LabResultSummaryDto[]> = await apiClient.get(`/v1/clinical-workflow/patients/${patientId}/lab-results`);
    return response.data;
  },

  getPrescriptions: async (patientId: string): Promise<PrescriptionSummaryDto[]> => {
    const response: AxiosResponse<PrescriptionSummaryDto[]> = await apiClient.get(`/v1/clinical-workflow/patients/${patientId}/prescriptions`);
    return response.data;
  },

  getBillingHandoff: async (patientId: string): Promise<BillingHandoffSummaryDto[]> => {
    const response: AxiosResponse<BillingHandoffSummaryDto[]> = await apiClient.get(`/v1/clinical-workflow/patients/${patientId}/billing-handoff`);
    return response.data;
  },

  getDashboardSummary: async (branchId?: string): Promise<ClinicalDashboardSummaryDto> => {
    const params = branchId ? { branchId } : {};
    const response: AxiosResponse<ClinicalDashboardSummaryDto> = await apiClient.get('/v1/clinical-workflow/dashboard-summary', { params });
    return response.data;
  },

  saveVitals: async (patientId: string, data: SaveVitalsPayload): Promise<VitalsSummaryDto> => {
    const response: AxiosResponse<VitalsSummaryDto> = await apiClient.post(`/v1/clinical-workflow/patients/${patientId}/vitals`, data);
    return response.data;
  },

  markVitalsEnteredInError: async (
    patientId: string,
    vitalsId: string,
    reason: string
  ): Promise<void> => {
    await apiClient.post(`/v1/clinical-workflow/patients/${patientId}/vitals/${vitalsId}/entered-in-error`, { reason });
  },

  saveTriage: async (patientId: string, data: SaveTriagePayload): Promise<void> => {
    await apiClient.post(`/v1/clinical-workflow/patients/${patientId}/triage`, data);
  },

  getTriage: async (patientId: string): Promise<TriageSummaryDto[]> => {
    const response: AxiosResponse<TriageSummaryDto[]> = await apiClient.get(`/v1/clinical-workflow/patients/${patientId}/triage`);
    return response.data;
  },

  markTriageEnteredInError: async (
    patientId: string,
    triageId: string,
    reason: string
  ): Promise<void> => {
    await apiClient.post(`/v1/clinical-workflow/patients/${patientId}/triage/${triageId}/entered-in-error`, { reason });
  },

  saveDraftSOAP: async (
    patientId: string,
    encounterId: string,
    data: SaveDraftSoapPayload
  ): Promise<SoapDraftSummaryDto> => {
    const response: AxiosResponse<SoapDraftSummaryDto> = await apiClient.post(
      `/v1/clinical-workflow/patients/${patientId}/encounters/${encounterId}/soap-draft`,
      data
    );
    return response.data;
  },

  getDraftSOAP: async (
    patientId: string,
    encounterId: string
  ): Promise<SoapDraftSummaryDto | null> => {
    const response: AxiosResponse<SoapDraftSummaryDto | null> = await apiClient.get(
      `/v1/clinical-workflow/patients/${patientId}/encounters/${encounterId}/soap-draft`
    );
    return response.data;
  },

  getLabDraftEncodingContext: async (
    patientId: string,
    orderId: string
  ): Promise<LabResultDraftContextDto> => {
    const response: AxiosResponse<LabResultDraftContextDto> = await apiClient.get(
      `/v1/clinical-workflow/patients/${patientId}/orders/${orderId}/lab-draft-context`
    );
    return response.data;
  },

  signSOAP: async (
    patientId: string,
    encounterId: string
  ): Promise<SoapDraftSummaryDto> => {
    const response: AxiosResponse<SoapDraftSummaryDto> = await apiClient.post(
      `/v1/clinical-workflow/patients/${patientId}/encounters/${encounterId}/soap-sign`,
      {}
    );
    return response.data;
  },

  createClinicalOrder: async (
    patientId: string,
    encounterId: string,
    data: CreateClinicalOrderPayload
  ): Promise<ClinicalOrderCreatedDto> => {
    const response: AxiosResponse<ClinicalOrderCreatedDto> = await apiClient.post(
      `/v1/clinical-workflow/patients/${patientId}/encounters/${encounterId}/orders`,
      data
    );
    return response.data;
  },

  cancelClinicalOrder: async (
    patientId: string,
    encounterId: string,
    orderId: string,
    data: CancelClinicalOrderPayload
  ): Promise<ClinicalOrderSummaryDto> => {
    const response: AxiosResponse<ClinicalOrderSummaryDto> = await apiClient.post(
      `/v1/clinical-workflow/patients/${patientId}/encounters/${encounterId}/orders/${orderId}/cancel`,
      data
    );
    return response.data;
  },

  receiveLabOrder: async (
    patientId: string,
    orderId: string,
    data: ReceiveLabOrderPayload
  ): Promise<LabSpecimenSummaryDto> => {
    const response: AxiosResponse<LabSpecimenSummaryDto> = await apiClient.post(
      `/v1/clinical-workflow/patients/${patientId}/orders/${orderId}/receive-lab`,
      data
    );
    return response.data;
  },

  saveDraftLabResult: async (
    patientId: string,
    orderId: string,
    data: SaveDraftLabResultPayload
  ): Promise<LabResultDraftSummaryDto> => {
    const response: AxiosResponse<LabResultDraftSummaryDto> = await apiClient.post(
      `/v1/clinical-workflow/patients/${patientId}/orders/${orderId}/draft-lab-result`,
      data
    );
    return response.data;
  },

  getValidatedResults: async (): Promise<ValidatedResultSummaryDto[]> => {
    const response: AxiosResponse<ValidatedResultSummaryDto[]> = await apiClient.get(
      `/v1/clinical-workflow/lab/validated-results`
    );
    return response.data;
  },

  getReleasedResults: async (): Promise<ReleasedResultQueueDto[]> => {
    const response: AxiosResponse<ReleasedResultQueueDto[]> = await apiClient.get(
      `/v1/clinical-workflow/lab/released-results`
    );
    return response.data;
  },

  validateLabResult: async (
    patientId: string,
    orderId: string,
    data: ValidateLabResultPayload
  ): Promise<LabValidationSummaryDto> => {
    const response: AxiosResponse<LabValidationSummaryDto> = await apiClient.post(
      `/v1/clinical-workflow/patients/${patientId}/orders/${orderId}/validate-lab-result`,
      data
    );
    return response.data;
  },

  getReleasedLabResultDetail: async (
    patientId: string,
    orderId: string,
  ): Promise<ReleasedResultSummaryDto> => {
    const response: AxiosResponse<ReleasedResultSummaryDto> = await apiClient.get(
      `/v1/clinical-workflow/patients/${patientId}/orders/${orderId}/released-lab-result`,
    );
    return response.data;
  },

  getParameterDefinitions: async (
    orderId: string,
  ): Promise<LabParameterDefinitionDto[]> => {
    const response: AxiosResponse<LabParameterDefinitionDto[]> = await apiClient.get(
      `/v1/clinical-workflow/lab/orders/${orderId}/parameter-definitions`,
    );
    return response.data;
  },

  releaseLabResult: async (
    patientId: string,
    orderId: string,
    data: ReleaseLabResultPayload
  ): Promise<ReleasedResultSummaryDto> => {
    const response: AxiosResponse<ReleasedResultSummaryDto> = await apiClient.post(
      `/v1/clinical-workflow/patients/${patientId}/orders/${orderId}/release-lab-result`,
      data
    );
    return response.data;
  },

  getLabTestDefinitions: async (): Promise<LabTestDefinitionSummaryDto[]> => {
    const response: AxiosResponse<LabTestDefinitionSummaryDto[]> = await apiClient.get(
      `/v1/clinical-workflow/lab/test-definitions`
    );
    return response.data;
  },
};
