import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface ItSession {
  id: string;
  userId: string;
  tenantId: string;
  branchId: string;
  userAgent: string;
  ipAddress: string;
  lastRotatedAt: string;
  user: {
    email: string;
    roles: { role: { name: string } }[];
  };
  branch?: {
    name: string;
  };
}

export interface ItIntegration {
  id: string;
  name: string;
  protocol: string;
  direction: string;
  status: string;
  lastSync: string;
  errorCount: number;
  description: string;
  endpoint: string;
}

export interface ItBackup {
  id: string;
  name: string;
  type: string;
  status: string;
  size: string;
  createdAt: string;
  duration: string;
  retentionDays: number;
  rpoMet: boolean;
}

export interface ItLog {
  id: string;
  tenantId: string;
  userId: string;
  eventKey: string;
  recordType: string;
  recordId: string;
  oldValues: any;
  newValues: any;
  createdAt: string;
  ipAddress: string;
  userAgent: string;
  activeRole: string;
  sessionId: string;
}

export interface ItHealth {
  services: {
    id: string;
    name: string;
    status: string;
    latency: number;
    uptime: number;
  }[];
  overallStatus: string;
}

export interface ItTicket {
  id: string;
  reportedBy?: { email: string };
  assignedTo?: { email: string };
  branch?: { name: string };
  issueType: string;
  summary: string;
  description?: string;
  status: string;
  priority: string;
  createdAt: string;
}

export const useTicketStats = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['it-support-ticket-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/it-support/tickets/stats');
      return res.data as { open: number; inProgress: number; total: number; urgent: number };
    },
  });

  return {
    stats: data || { open: 0, inProgress: 0, total: 0, urgent: 0 },
    loading: isLoading,
    statsError: error?.message || null,
  };
};

export const useSupportTickets = (_opts?: { pageSize?: number; priority?: string }) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['it-support-tickets'],
    queryFn: async () => {
      const res = await apiClient.get('/it-support/tickets');
      return res.data as ItTicket[];
    },
  });

  return {
    tickets: data || [],
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
};

export const useItSupport = (_branchId: string) => {
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['it-sessions'],
    queryFn: async () => {
      const res = await apiClient.get('/it-support/sessions');
      return res.data as ItSession[];
    },
  });

  const { data: integrations, isLoading: integrationsLoading } = useQuery({
    queryKey: ['it-integrations'],
    queryFn: async () => {
      const res = await apiClient.get('/it-support/integrations');
      return res.data as ItIntegration[];
    },
  });

  const { data: backups, isLoading: backupsLoading } = useQuery({
    queryKey: ['it-backups'],
    queryFn: async () => {
      const res = await apiClient.get('/it-support/backups');
      return res.data as ItBackup[];
    },
  });

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['it-health'],
    queryFn: async () => {
      const res = await apiClient.get('/it-support/health');
      return res.data as ItHealth;
    },
  });

  const fetchLogs = async (bId: string) => {
    const res = await apiClient.get(`/it-support/logs?branchId=${bId}`);
    return res.data as ItLog[];
  };

  return {
    sessions,
    integrations,
    backups,
    health,
    isLoading: sessionsLoading || integrationsLoading || backupsLoading || healthLoading,
    fetchLogs,
  };
};
