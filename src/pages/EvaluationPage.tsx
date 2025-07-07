
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PerformanceEvaluation from '@/components/features/PerformanceEvaluation';

const EvaluationPage = () => {
  return (
    <DashboardLayout>
      <PerformanceEvaluation />
    </DashboardLayout>
  );
};

export default EvaluationPage;
