import { useState, useEffect, useCallback } from 'react';
import { patientPortalService, PatientProfile, ReleasedLabResult, PatientPrescription, PatientInvoice } from '../services/patient-portal.service';

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

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await patientPortalService.getLabResults();
      setResults(res);
    } catch {
      // silently fail for auth errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { results, loading, refetch: fetch };
}

export function usePatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<PatientPrescription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await patientPortalService.getPrescriptions();
      setPrescriptions(res);
    } catch {
      // silently fail for auth errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { prescriptions, loading, refetch: fetch };
}

export function usePatientInvoices() {
  const [invoices, setInvoices] = useState<PatientInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await patientPortalService.getInvoices();
      setInvoices(res);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { invoices, loading, refetch: fetch };
}
