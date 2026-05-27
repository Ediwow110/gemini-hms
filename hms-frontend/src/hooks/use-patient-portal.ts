import { useState, useEffect, useCallback } from 'react';
import { 
  patientPortalService, 
  PatientProfile, 
  ReleasedLabResult, 
  PatientPrescription, 
  PatientInvoice,
  MedicalRecordRequest,
  RefillRequest
} from '../services/patient-portal.service';

export function usePatientProfile() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await patientPortalService.getProfile();
      setProfile(res);
    } catch (err: unknown) {
      const respErr = err as { response?: { status?: number } };
      if (respErr?.response?.status !== 401 && respErr?.response?.status !== 403) {
        setError('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { profile, loading, error, refetch: fetch };
}

export function usePatientLabResults() {
  const [results, setResults] = useState<ReleasedLabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await patientPortalService.getLabResults();
      setResults(res);
    } catch (err: unknown) {
      const respErr = err as { response?: { status?: number } };
      if (respErr?.response?.status !== 401 && respErr?.response?.status !== 403) {
        setError('Failed to load lab results');
      }
      console.error('usePatientLabResults error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { results, loading, error, refetch: fetch };
}

export function usePatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<PatientPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await patientPortalService.getPrescriptions();
      setPrescriptions(res);
    } catch (err: unknown) {
      const respErr = err as { response?: { status?: number } };
      if (respErr?.response?.status !== 401 && respErr?.response?.status !== 403) {
        setError('Failed to load prescriptions');
      }
      console.error('usePatientPrescriptions error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { prescriptions, loading, error, refetch: fetch };
}

export function usePatientInvoices() {
  const [invoices, setInvoices] = useState<PatientInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await patientPortalService.getInvoices();
      setInvoices(res);
    } catch (err: unknown) {
      const respErr = err as { response?: { status?: number } };
      if (respErr?.response?.status !== 401 && respErr?.response?.status !== 403) {
        setError('Failed to load invoices');
      }
      console.error('usePatientInvoices error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { invoices, loading, error, refetch: fetch };
}

export function usePatientMedicalRecordRequests() {
  const [requests, setRequests] = useState<MedicalRecordRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await patientPortalService.getMedicalRecordRequests();
      setRequests(res);
    } catch (err: unknown) {
      const respErr = err as { response?: { status?: number } };
      if (respErr?.response?.status !== 401 && respErr?.response?.status !== 403) {
        setError('Failed to load medical record requests');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { requests, loading, error, refetch: fetch };
}

export function usePatientRefillRequests() {
  const [requests, setRequests] = useState<RefillRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await patientPortalService.getRefillRequests();
      setRequests(res);
    } catch (err: unknown) {
      const respErr = err as { response?: { status?: number } };
      if (respErr?.response?.status !== 401 && respErr?.response?.status !== 403) {
        setError('Failed to load refill requests');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { requests, loading, error, refetch: fetch };
}
