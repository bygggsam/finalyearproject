
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UserManagement from '@/components/features/UserManagement';

const UsersPage = () => {
  return (
    <DashboardLayout>
      <UserManagement />
    </DashboardLayout>
  );
};

export default UsersPage;
