import React from 'react';
import { useAuth } from '../../hooks/use-user';
import { UsersPage } from '../../portals/admin/UsersPage';
import { UserList } from './UserList';

export const UsersWrapper: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.includes('Super Admin');
  
  if (isSuperAdmin) {
    return <UsersPage />;
  }
  return <UserList />;
};

export default UsersWrapper;
