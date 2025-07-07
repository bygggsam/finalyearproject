
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StageTracker from '@/components/features/StageTracker';

const StagesPage = () => {
  return (
    <DashboardLayout>
      <StageTracker />
    </DashboardLayout>
  );
};

export default StagesPage;
