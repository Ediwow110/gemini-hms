export interface UserState {
  id: string;
  email: string;
  tenantId: string;
  branchId?: string;
  roles: string[];
  permissions: string[];
}

export interface AuthContextType {
  user: UserState | null;
  isLoading: boolean;
  logout: () => void;
  refetchUser: () => Promise<void>;
}
