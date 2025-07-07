
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PatientRecords from '@/components/features/PatientRecords';

const PatientsPage = () => {
  return (
    <DashboardLayout>
      <PatientRecords />
    </DashboardLayout>
  );
};

export default PatientsPage;
