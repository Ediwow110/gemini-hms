import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicalWorkflowService } from '../services/clinicalWorkflow.service';
import type { SaveVitalsPayload, SaveTriagePayload, SaveDraftSoapPayload, CreateClinicalOrderPayload, CancelClinicalOrderPayload, ReceiveLabOrderPayload, SaveDraftLabResultPayload, ValidateLabResultPayload, ReleaseLabResultPayload } from '../services/clinicalWorkflow.service';
import { useUser } from './use-user';

export const useClinicalWorkQueue = (branchId?: string) => {
  const user = useUser();
  const effectiveBranchId = branchId || user?.branchId;
  const roleScope = user?.roles?.join(',');
  return useQuery({
    queryKey: ['clinical-workflow', 'work-queue', user?.tenantId, effectiveBranchId, user?.id, roleScope],
    queryFn: () => clinicalWorkflowService.getWorkQueue(effectiveBranchId),
    enabled: !!user?.tenantId,
    retry: false,
  });
};

export const usePatientClinicalSummary = (patientId: string) => {
  const user = useUser();
  const roleScope = user?.roles?.join(',');
  return useQuery({
    queryKey: ['clinical-workflow', 'patient-summary', user?.tenantId, user?.branchId, user?.id, roleScope, patientId],
    queryFn: () => clinicalWorkflowService.getPatientSummary(patientId),
    enabled: !!patientId && !!user?.tenantId,
    retry: false,
  });
};

export const usePatientEncounters = (patientId: string) => {
  const user = useUser();
  const roleScope = user?.roles?.join(',');
  return useQuery({
    queryKey: ['clinical-workflow', 'encounters', user?.tenantId, user?.branchId, user?.id, roleScope, patientId],
    queryFn: () => clinicalWorkflowService.getEncounters(patientId),
    enabled: !!patientId && !!user?.tenantId,
    retry: false,
  });
};

export const usePatientVitals = (patientId: string) => {
  const user = useUser();
  const roleScope = user?.roles?.join(',');
  return useQuery({
    queryKey: ['clinical-workflow', 'vitals', user?.tenantId, user?.branchId, user?.id, roleScope, patientId],
    queryFn: () => clinicalWorkflowService.getVitals(patientId),
    enabled: !!patientId && !!user?.tenantId,
    retry: false,
  });
};

export const usePatientOrders = (patientId: string) => {
  const user = useUser();
  const roleScope = user?.roles?.join(',');
  return useQuery({
    queryKey: ['clinical-workflow', 'orders', user?.tenantId, user?.branchId, user?.id, roleScope, patientId],
    queryFn: () => clinicalWorkflowService.getOrders(patientId),
    enabled: !!patientId && !!user?.tenantId,
    retry: false,
  });
};

export const usePatientTriage = (patientId: string) => {
  const user = useUser();
  const roleScope = user?.roles?.join(',');
  return useQuery({
    queryKey: ['clinical-workflow', 'triage', user?.tenantId, user?.branchId, user?.id, roleScope, patientId],
    queryFn: () => clinicalWorkflowService.getTriage(patientId),
    enabled: !!patientId && !!user?.tenantId,
    retry: false,
  });
};

export const usePatientLabResults = (patientId: string) => {
  const user = useUser();
  const roleScope = user?.roles?.join(',');
  return useQuery({
    queryKey: ['clinical-workflow', 'lab-results', user?.tenantId, user?.branchId, user?.id, roleScope, patientId],
    queryFn: () => clinicalWorkflowService.getLabResults(patientId),
    enabled: !!patientId && !!user?.tenantId,
    retry: false,
  });
};

export const usePatientPrescriptions = (patientId: string) => {
  const user = useUser();
  const roleScope = user?.roles?.join(',');
  return useQuery({
    queryKey: ['clinical-workflow', 'prescriptions', user?.tenantId, user?.branchId, user?.id, roleScope, patientId],
    queryFn: () => clinicalWorkflowService.getPrescriptions(patientId),
    enabled: !!patientId && !!user?.tenantId,
    retry: false,
  });
};

export const usePatientBillingHandoff = (patientId: string) => {
  const user = useUser();
  const roleScope = user?.roles?.join(',');
  return useQuery({
    queryKey: ['clinical-workflow', 'billing-handoff', user?.tenantId, user?.branchId, user?.id, roleScope, patientId],
    queryFn: () => clinicalWorkflowService.getBillingHandoff(patientId),
    enabled: !!patientId && !!user?.tenantId,
    retry: false,
  });
};

export const useSaveVitals = () => {
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: ({
      patientId,
      data,
    }: {
      patientId: string;
      data: SaveVitalsPayload;
    }) => clinicalWorkflowService.saveVitals(patientId, data),

    onSuccess: (_data, variables) => {
      const { patientId } = variables;
      const roleScope = user?.roles?.join(',');

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'vitals',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'patient-summary',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });
    },
  });
};

export const useMarkVitalsEnteredInError = () => {
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: ({
      patientId,
      vitalsId,
      reason,
    }: {
      patientId: string;
      vitalsId: string;
      reason: string;
    }) => clinicalWorkflowService.markVitalsEnteredInError(patientId, vitalsId, reason),

    onSuccess: (_data, variables) => {
      const { patientId } = variables;
      const roleScope = user?.roles?.join(',');

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'vitals',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'patient-summary',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });
    },
  });
};

export const useSaveTriage = () => {
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: ({
      patientId,
      data,
    }: {
      patientId: string;
      data: SaveTriagePayload;
    }) => clinicalWorkflowService.saveTriage(patientId, data),

    onSuccess: (_data, variables) => {
      const { patientId } = variables;
      const roleScope = user?.roles?.join(',');

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'work-queue',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'patient-summary',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });
      
      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'lab-draft-context',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'validated-results',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'triage',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });
    },
  });
};

export const useMarkTriageEnteredInError = () => {
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: ({
      patientId,
      triageId,
      reason,
    }: {
      patientId: string;
      triageId: string;
      reason: string;
    }) => clinicalWorkflowService.markTriageEnteredInError(patientId, triageId, reason),

    onSuccess: (_data, variables) => {
      const { patientId } = variables;
      const roleScope = user?.roles?.join(',');

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'triage',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'patient-summary',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });
    },
  });
};

export const useClinicalDashboardSummary = (branchId?: string) => {
  const user = useUser();
  const effectiveBranchId = branchId || user?.branchId;
  const roleScope = user?.roles?.join(',');
  return useQuery({
    queryKey: ['clinical-workflow', 'dashboard-summary', user?.tenantId, effectiveBranchId, user?.id, roleScope],
    queryFn: () => clinicalWorkflowService.getDashboardSummary(effectiveBranchId),
    enabled: !!user?.tenantId,
    retry: false,
  });
};

export const usePatientSoapDraft = (patientId: string, encounterId: string) => {
  const user = useUser();
  const roleScope = user?.roles?.join(',');
  return useQuery({
    queryKey: [
      'clinical-workflow',
      'soap-draft',
      user?.tenantId,
      user?.branchId,
      user?.id,
      roleScope,
      patientId,
      encounterId,
    ],
    queryFn: () => clinicalWorkflowService.getDraftSOAP(patientId, encounterId),
    enabled: !!patientId && !!encounterId && !!user?.tenantId,
    retry: false,
  });
};

export const useSignSOAP = () => {
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: ({
      patientId,
      encounterId,
    }: {
      patientId: string;
      encounterId: string;
    }) => clinicalWorkflowService.signSOAP(patientId, encounterId),

    onSuccess: (_data, variables) => {
      const { patientId, encounterId } = variables;
      const roleScope = user?.roles?.join(',');

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'soap-draft',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
          encounterId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'encounters',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'patient-summary',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });
    },
  });
};

export const useCreateClinicalOrder = () => {
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: ({
      patientId,
      encounterId,
      data,
    }: {
      patientId: string;
      encounterId: string;
      data: CreateClinicalOrderPayload;
    }) => clinicalWorkflowService.createClinicalOrder(patientId, encounterId, data),

    onSuccess: (_data, variables) => {
      const { patientId } = variables;
      const roleScope = user?.roles?.join(',');

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'orders',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'encounters',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'patient-summary',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });
    },
  });
};

export const useCancelClinicalOrder = () => {
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: ({
      patientId,
      encounterId,
      orderId,
      data,
    }: {
      patientId: string;
      encounterId: string;
      orderId: string;
      data: CancelClinicalOrderPayload;
    }) => clinicalWorkflowService.cancelClinicalOrder(patientId, encounterId, orderId, data),

    onSuccess: (_data, variables) => {
      const { patientId } = variables;
      const roleScope = user?.roles?.join(',');

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'orders',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'encounters',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'patient-summary',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });
    },
  });
};

export const useReceiveLabOrder = () => {
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: ({
      patientId,
      orderId,
      data,
    }: {
      patientId: string;
      orderId: string;
      data: ReceiveLabOrderPayload;
    }) => clinicalWorkflowService.receiveLabOrder(patientId, orderId, data),

    onSuccess: (_data, variables) => {
      const { patientId } = variables;
      const roleScope = user?.roles?.join(',');

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'work-queue',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'orders',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'lab-results',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'patient-summary',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });
    },
  });
};

export const useSaveDraftSOAP = () => {
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: ({
      patientId,
      encounterId,
      data,
    }: {
      patientId: string;
      encounterId: string;
      data: SaveDraftSoapPayload;
    }) => clinicalWorkflowService.saveDraftSOAP(patientId, encounterId, data),

    onSuccess: (_data, variables) => {
      const { patientId, encounterId } = variables;
      const roleScope = user?.roles?.join(',');

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'soap-draft',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
          encounterId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'encounters',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'patient-summary',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });
    },
  });
};

export const useSaveDraftLabResult = () => {
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: ({
      patientId,
      orderId,
      data,
    }: {
      patientId: string;
      orderId: string;
      data: SaveDraftLabResultPayload;
    }) => clinicalWorkflowService.saveDraftLabResult(patientId, orderId, data),

    onSuccess: (_data, variables) => {
      const { patientId } = variables;
      const roleScope = user?.roles?.join(',');

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'lab-results',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'orders',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'patient-summary',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'lab-draft-context',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'validated-results',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
        ],
      });
    },
  });
};

export const useReleaseLabResult = () => {
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: ({
      patientId,
      orderId,
      data,
    }: {
      patientId: string;
      orderId: string;
      data: ReleaseLabResultPayload;
    }) => clinicalWorkflowService.releaseLabResult(patientId, orderId, data),

    onSuccess: (_data, variables) => {
      const { patientId } = variables;
      const roleScope = user?.roles?.join(',');

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'work-queue',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'lab-results',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'orders',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'patient-summary',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'validated-results',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'released-results',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
        ],
      });
    },
  });
};

export const useLabDraftEncodingContext = (patientId: string, orderId: string) => {
  const user = useUser();
  const roleScope = user?.roles?.join(',');
  return useQuery({
    queryKey: [
      'clinical-workflow',
      'lab-draft-context',
      user?.tenantId,
      user?.branchId,
      user?.id,
      roleScope,
      patientId,
      orderId,
    ],
    queryFn: () => clinicalWorkflowService.getLabDraftEncodingContext(patientId, orderId),
    enabled: !!patientId && !!orderId && !!user?.tenantId,
    retry: false,
  });
};

export const useValidatedResults = () => {
  const user = useUser();
  const roleScope = user?.roles?.join(',');
  return useQuery({
    queryKey: [
      'clinical-workflow',
      'validated-results',
      user?.tenantId,
      user?.branchId,
      user?.id,
      roleScope,
    ],
    queryFn: () => clinicalWorkflowService.getValidatedResults(),
    enabled: !!user?.tenantId,
    retry: false,
  });
};

export const useReleasedResults = () => {
  const user = useUser();
  const roleScope = user?.roles?.join(',');
  return useQuery({
    queryKey: [
      'clinical-workflow',
      'released-results',
      user?.tenantId,
      user?.branchId,
      user?.id,
      roleScope,
    ],
    queryFn: () => clinicalWorkflowService.getReleasedResults(),
    enabled: !!user?.tenantId,
    retry: false,
  });
};

export const useReleasedLabResultDetail = (patientId: string, orderId: string) => {
  const user = useUser();
  const roleScope = user?.roles?.join(',');
  return useQuery({
    queryKey: [
      'clinical-workflow',
      'released-lab-result-detail',
      user?.tenantId,
      user?.branchId,
      user?.id,
      roleScope,
      patientId,
      orderId,
    ],
    queryFn: () => clinicalWorkflowService.getReleasedLabResultDetail(patientId, orderId),
    enabled: !!patientId && !!orderId && !!user?.tenantId,
    retry: false,
  });
};

export const useParameterDefinitions = (orderId: string) => {
  const user = useUser();
  const roleScope = user?.roles?.join(',');
  return useQuery({
    queryKey: [
      'clinical-workflow',
      'parameter-definitions',
      user?.tenantId,
      user?.branchId,
      user?.id,
      roleScope,
      orderId,
    ],
    queryFn: () => clinicalWorkflowService.getParameterDefinitions(orderId),
    enabled: !!orderId && !!user?.tenantId,
    retry: false,
  });
};

export const useValidateLabResult = () => {
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: ({
      patientId,
      orderId,
      data,
    }: {
      patientId: string;
      orderId: string;
      data: ValidateLabResultPayload;
    }) => clinicalWorkflowService.validateLabResult(patientId, orderId, data),

    onSuccess: (_data, variables) => {
      const { patientId } = variables;
      const roleScope = user?.roles?.join(',');

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'lab-results',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'orders',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'patient-summary',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'lab-draft-context',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
          patientId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'validated-results',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
        ],
      });
    },
  });
};

export const useLabTestDefinitions = () => {
  const user = useUser();
  const roleScope = user?.roles?.join(',');
  return useQuery({
    queryKey: [
      'clinical-workflow',
      'lab-test-definitions',
      user?.tenantId,
      user?.branchId,
      user?.id,
      roleScope,
    ],
    queryFn: () => clinicalWorkflowService.getLabTestDefinitions(),
    enabled: !!user?.tenantId,
    retry: false,
  });
};
