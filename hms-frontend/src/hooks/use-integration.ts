import { useQuery } from '@tanstack/react-query';
import { integrationService } from '../services/integration.service';

export const useIntegrationNotifications = () => {
  return useQuery({
    queryKey: ['integration', 'notifications'],
    queryFn: () => integrationService.getNotifications(),
    retry: false, // Fail fast to show unauthorized/error states
  });
};

export const useIntegrationApprovals = () => {
  return useQuery({
    queryKey: ['integration', 'approvals'],
    queryFn: () => integrationService.getApprovals(),
    retry: false,
  });
};

export const useIntegrationGlobalSearch = (query: string) => {
  return useQuery({
    queryKey: ['integration', 'global-search', query],
    queryFn: () => integrationService.globalSearch(query),
    enabled: !!query,
    retry: false,
  });
};

export const useIntegrationPatientTimeline = (patientId: string) => {
  return useQuery({
    queryKey: ['integration', 'patient-timeline', patientId],
    queryFn: () => integrationService.getPatientTimeline(patientId),
    enabled: !!patientId,
    retry: false,
  });
};

export const useIntegrationAssetTimeline = (assetId: string) => {
  return useQuery({
    queryKey: ['integration', 'asset-timeline', assetId],
    queryFn: () => integrationService.getAssetTimeline(assetId),
    enabled: !!assetId,
    retry: false,
  });
};

export const useIntegrationReconciliation = () => {
  return useQuery({
    queryKey: ['integration', 'reconciliation'],
    queryFn: () => integrationService.getReconciliationIssues(),
    retry: false,
  });
};

export const useIntegrationActivityAudit = () => {
  return useQuery({
    queryKey: ['integration', 'activity-audit'],
    queryFn: () => integrationService.getActivityAudit(),
    retry: false,
  });
};
