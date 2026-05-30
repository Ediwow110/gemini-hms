import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace('/api/v1', '/patient-portal').replace('/api', '/patient-portal');
  }
  return import.meta.env.PROD ? '/patient-portal' : '/patient-portal';
};

let patientCsrfToken: string | null = null;

function setPatientCsrfToken(token: string | null): void {
  patientCsrfToken = token;
}

const patientApi = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

patientApi.interceptors.request.use((config) => {
  const UNSAFE_METHODS = ['post', 'put', 'patch', 'delete'];
  if (config.method && UNSAFE_METHODS.includes(config.method.toLowerCase())) {
    if (patientCsrfToken) {
      config.headers['X-CSRF-Token'] = patientCsrfToken;
    }
  }
  return config;
});

patientApi.interceptors.response.use((response) => {
  if (response.data?.csrfToken) {
    setPatientCsrfToken(response.data.csrfToken);
  }
  return response;
});

export interface PatientProfile {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dob: string;
  status: string;
  createdAt: string;
}

export interface ReleasedLabResult {
  id: string;
  status: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  results: any;
  remarks?: string;
  lockedAt?: string;
  createdAt: string;
}

export interface PatientPrescription {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration?: string;
  notes?: string;
  status: string;
  createdAt: string;
}

export interface PatientInvoice {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  latestPostedPaymentId: string | null;
  createdAt: string;
}

export interface RefillRequest {
  id: string;
  prescriptionId: string;
  status: string;
  reason?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface MedicalRecordRequest {
  id: string;
  requestType: string;
  status: string;
  reason?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface PatientPortalLoginInput {
  tenantCode: string;
  email: string;
  password: string;
}

export class PatientPortalService {
  async login(input: PatientPortalLoginInput): Promise<void> {
    await patientApi.post('/auth/login', input);
  }

  async getProfile(): Promise<PatientProfile> {
    const res = await patientApi.get('/profile');
    return res.data;
  }

  async getLabResults(): Promise<ReleasedLabResult[]> {
    const res = await patientApi.get('/lab-results');
    return res.data;
  }

  async getPrescriptions(): Promise<PatientPrescription[]> {
    const res = await patientApi.get('/prescriptions');
    return res.data;
  }

  async getInvoices(): Promise<PatientInvoice[]> {
    const res = await patientApi.get('/invoices');
    return res.data;
  }

  async downloadLabResultPdf(id: string): Promise<Blob> {
    const res = await patientApi.get(`/lab-results/${id}/pdf`, { responseType: 'blob' });
    return res.data;
  }

  async downloadInvoicePdf(id: string): Promise<Blob> {
    const res = await patientApi.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
    return res.data;
  }

  async downloadReceiptPdf(id: string): Promise<Blob> {
    const res = await patientApi.get(`/payments/${id}/receipt`, { responseType: 'blob' });
    return res.data;
  }

  async downloadPrescriptionPdf(id: string): Promise<Blob> {
    const res = await patientApi.get(`/prescriptions/${id}/pdf`, { responseType: 'blob' });
    return res.data;
  }

  async createRefillRequest(prescriptionId: string, reason?: string): Promise<RefillRequest> {
    const res = await patientApi.post(`/prescriptions/${prescriptionId}/refill-request`, { reason });
    return res.data;
  }

  async getRefillRequests(): Promise<RefillRequest[]> {
    const res = await patientApi.get('/refill-requests');
    return res.data;
  }

  async createMedicalRecordRequest(requestType: string, reason?: string): Promise<MedicalRecordRequest> {
    const res = await patientApi.post('/medical-record-requests', { requestType, reason });
    return res.data;
  }

  async getMedicalRecordRequests(): Promise<MedicalRecordRequest[]> {
    const res = await patientApi.get('/medical-record-requests');
    return res.data;
  }
}

export const patientPortalService = new PatientPortalService();
