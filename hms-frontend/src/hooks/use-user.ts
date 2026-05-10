import { createContext, useContext } from 'react';

interface UserState {
  id: string;
  name: string;
  role: string | null;
  permissions: string[];
}

// Mocking the user context with default permissions matching our backend seed
export const UserContext = createContext<UserState>({ 
  id: 'user-current-manager',
  name: 'Super Admin User',
  role: 'Super Admin',
  permissions: [
    'approval.request.view',
    'approval.request.process',
    'approval.request.create',
    'billing.payment.create',
    'billing.invoice.view',
    'queue.manage',
    'queue.view',
    'lab.result.amend',
    'inventory.item.view',
    'inventory.item.create',
    'inventory.stock.receive',
    'inventory.stock.dispense',
  ]
});

export const useUser = () => useContext(UserContext);

export const usePermissions = () => {
  const { permissions } = useUser();
  
  const hasPermission = (permission: string) => permissions.includes(permission);
  const hasAnyPermission = (perms: string[]) => perms.some(p => permissions.includes(p));
  const hasAllPermissions = (perms: string[]) => perms.every(p => permissions.includes(p));

  return { hasPermission, hasAnyPermission, hasAllPermissions };
};
