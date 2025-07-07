
import React, { useEffect, Suspense } from 'react';
import { useAuthStore } from '@/stores/authStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoginPage from '@/components/auth/LoginPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Loader2 } from 'lucide-react';
import { DashboardSkeleton } from '@/components/ui/optimized-loader';

// Lazy load dashboard components for faster initial load
const AdminDashboard = React.lazy(() => import('@/components/dashboards/AdminDashboard'));
const DoctorDashboard = React.lazy(() => import('@/components/dashboards/DoctorDashboard'));
const RecordsOfficerDashboard = React.lazy(() => import('@/components/dashboards/RecordsOfficerDashboard'));
const AnalystDashboard = React.lazy(() => import('@/components/dashboards/AnalystDashboard'));

const Index = () => {
  const { user, isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    // Initialize auth immediately without waiting
    initialize();
  }, [initialize]);

  // Show optimized loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Activity className="h-6 w-6 text-teal-600" />
              <span>UHS Clinical System</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-600" />
            <p className="text-gray-600">Loading your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  // Render appropriate dashboard based on user role with suspense
  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return (
          <Suspense fallback={<DashboardSkeleton />}>
            <AdminDashboard />
          </Suspense>
        );
      case 'doctor':
        return (
          <Suspense fallback={<DashboardSkeleton />}>
            <DoctorDashboard />
          </Suspense>
        );
      case 'records_officer':
        return (
          <Suspense fallback={<DashboardSkeleton />}>
            <RecordsOfficerDashboard />
          </Suspense>
        );
      case 'analyst':
        return (
          <Suspense fallback={<DashboardSkeleton />}>
            <AnalystDashboard />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<DashboardSkeleton />}>
            <DoctorDashboard />
          </Suspense>
        );
    }
  };

  return (
    <DashboardLayout>
      {renderDashboard()}
    </DashboardLayout>
  );
};

export default Index;
