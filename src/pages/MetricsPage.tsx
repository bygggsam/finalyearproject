
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SystemMetrics from '@/components/features/SystemMetrics';

const MetricsPage = () => {
  return (
    <DashboardLayout>
      <SystemMetrics />
    </DashboardLayout>
  );
};

export default MetricsPage;
