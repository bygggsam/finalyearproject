
import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  LogOut, 
  Menu, 
  X, 
  Upload, 
  Users, 
  FileText, 
  BarChart3,
  CheckCircle2,
  Settings,
  User,
  FileCheck,
  Scan,
  ArrowRight,
  Target
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/', icon: BarChart3 },
      { name: 'Upload Documents', href: '/upload', icon: Upload },
      { name: 'Handwritten Digitizer', href: '/handwritten', icon: Scan },
      { name: 'Document Formatter', href: '/formatter', icon: FileCheck },
      { name: 'Stage Tracker', href: '/stages', icon: ArrowRight },
      { name: 'Performance Eval', href: '/evaluation', icon: Target },
      { name: 'Patient Records', href: '/patients', icon: FileText },
    ];

    if (user?.role === 'records_officer' || user?.role === 'admin') {
      baseItems.push({ name: 'Verification', href: '/verification', icon: CheckCircle2 });
    }

    if (user?.role === 'admin') {
      baseItems.push(
        { name: 'User Management', href: '/users', icon: Users },
        { name: 'System Metrics', href: '/metrics', icon: Settings }
      );
    }

    return baseItems;
  };

  const handleLogout = () => {
    logout();
  };

  const handleNavigation = (href: string) => {
    navigate(href);
    setSidebarOpen(false);
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-teal-600" />
            <div className="ml-3">
              <h1 className="text-lg font-bold text-gray-900">UHS Jaja</h1>
              <p className="text-xs text-gray-500">Clinical CDSS</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-6 px-3 flex-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={`
                  w-full flex items-center px-3 py-3 mt-2 text-sm font-medium rounded-md transition-all duration-200
                  ${isActive 
                    ? 'bg-teal-100 text-teal-700 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center mb-3">
            <div className="bg-teal-100 p-2 rounded-full">
              <User className="h-4 w-4 text-teal-600" />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full text-gray-600 hover:text-gray-900"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-0">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
