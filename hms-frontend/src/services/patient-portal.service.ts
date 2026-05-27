import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace('/api/v1', '/patient-portal').replace('/api', '/patient-portal');
  }
  return import.meta.env.PROD ? '/patient-portal' : '/patient-portal';
};

const patientApi = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
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
  createdAt: string;
}

export class PatientPortalService {
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
}

export const patientPortalService = new PatientPortalService();
