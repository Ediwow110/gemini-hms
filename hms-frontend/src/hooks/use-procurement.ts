import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface VendorPerformance {
  id: string;
  supplier: string;
  onTimeRate: number;
  qualityRate: number;
  responseTime: string;
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface RFQItem {
  id: string;
  reference: string;
  items: string;
  invitedSuppliers: number;
  quotesReceived: number;
  deadline: string;
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
}

export interface Quote {
  id: string;
  supplier: string;
  amount: number;
  deliveryDays: number;
  warrantyMonths: number;
  score: number;
  status: 'PENDING' | 'SELECTED' | 'REJECTED';
}

export interface ReceivingItem {
  id: string;
  poNumber: string;
  supplier: string;
  expectedDate: string;
  itemsCount: number;
  status: 'PENDING' | 'PARTIAL' | 'RECEIVED' | 'ISSUE';
}

export interface PurchaseRequest {
  id: string;
  source: string;
  targetWarehouse: string;
  items: string[];
  status: 'PENDING' | 'FULFILLED' | 'IN_TRANSIT';
  date: string;
}

export const useProcurement = (branchId: string) => {
  const queryClient = useQueryClient();

  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ['procurement-vendors'],
    queryFn: async () => {
      const res = await apiClient.get('/procurement/suppliers');
      return res.data;
    },
  });

  const { data: performance, isLoading: perfLoading } = useQuery({
    queryKey: ['procurement-performance'],
    queryFn: async () => {
      const res = await apiClient.get('/procurement/suppliers/performance');
      return res.data as VendorPerformance[];
    },
  });

  const { data: rfqs, isLoading: rfqsLoading } = useQuery({
    queryKey: ['procurement-rfqs'],
    queryFn: async () => {
      const res = await apiClient.get('/procurement/rfqs');
      return res.data as RFQItem[];
    },
  });

  const { data: receiving, isLoading: receivingLoading } = useQuery({
    queryKey: ['procurement-receiving', branchId],
    queryFn: async () => {
      const res = await apiClient.get(`/procurement/receiving?branchId=${branchId}`);
      return res.data as ReceivingItem[];
    },
    enabled: !!branchId,
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['procurement-requests', branchId],
    queryFn: async () => {
      const res = await apiClient.get(`/procurement/purchase-requests?branchId=${branchId}`);
      return res.data as PurchaseRequest[];
    },
    enabled: !!branchId,
  });

  const fetchQuotes = async (rfqId: string) => {
    const res = await apiClient.get(`/procurement/rfqs/${rfqId}/quotes`);
    return res.data as Quote[];
  };

  return {
    vendors,
    performance,
    rfqs,
    receiving,
    requests,
    isLoading: vendorsLoading || perfLoading || rfqsLoading || receivingLoading || requestsLoading,
    fetchQuotes,
    refetchAll: () => queryClient.invalidateQueries({ queryKey: ['procurement'] }),
  };
};
