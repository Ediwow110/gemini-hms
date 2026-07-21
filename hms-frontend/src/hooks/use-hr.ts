import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface HrAssignment {
  id: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
  };
  branch: {
    name: string;
    code: string;
  };
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface HrAttendanceRecord {
  id: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
  };
  checkIn: string;
  status: string;
  createdAt: string;
}

export interface HrEmployee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  branchId: string;
  status: string;
  rawStatus: string;
  joinedAt: string;
}

export interface HrLeaveRequest {
  id: string;
  employee: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    branchId: string;
  };
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  reason: string;
  days: number;
}

export interface HrLicense {
  id: string;
  employeeId: string;
  licenseType: string;
  licenseNumber: string;
  issuedAt: string;
  expiresAt: string;
  status: string;
}

export const useHr = (branchId: string) => {
  const queryClient = useQueryClient();

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['hr', 'employees'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/hr/employees');
      return res.data as HrEmployee[];
    },
  });

  const { data: leaveRequests, isLoading: leaveLoading } = useQuery({
    queryKey: ['hr', 'leave'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/hr/leave');
      return res.data as HrLeaveRequest[];
    },
  });

  const { data: licenses, isLoading: licensesLoading } = useQuery({
    queryKey: ['hr', 'licenses'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/hr/licenses');
      return res.data as HrLicense[];
    },
  });

  const { data: assignments, isLoading: assignmentsLoading, error: assignmentsError } = useQuery({
    queryKey: ['hr', 'assignments', branchId],
    queryFn: async () => {
      const res = await apiClient.get(`/v1/hr/assignments?branchId=${branchId}`);
      return res.data as HrAssignment[];
    },
    enabled: !!branchId,
  });

  const { data: attendance, isLoading: attendanceLoading, error: attendanceError } = useQuery({
    queryKey: ['hr', 'attendance', branchId],
    queryFn: async () => {
      const res = await apiClient.get(`/v1/hr/attendance?branchId=${branchId}`);
      return res.data as HrAttendanceRecord[];
    },
    enabled: !!branchId,
  });

  const fetchLicenses = async (employeeId: string) => {
    const res = await apiClient.get(`/v1/hr/licenses/${employeeId}`);
    return res.data as HrLicense[];
  };

  return {
    employees,
    leaveRequests,
    licenses,
    assignments,
    attendance,
    isLoading: employeesLoading || leaveLoading || licensesLoading || assignmentsLoading || attendanceLoading,
    error: assignmentsError || attendanceError,
    fetchLicenses,
    refetchAll: () => queryClient.invalidateQueries({ queryKey: ['hr'] }),
  };
};
