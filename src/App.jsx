import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { UserProvider, useUser } from '@/lib/userContext';
import AppLayout from '@/components/layout/AppLayout';
import { ROLES } from '@/lib/roles';

// Pages
import OwnerDashboard from '@/pages/OwnerDashboard';
import SalesDashboard from '@/pages/SalesDashboard';
import SalesListingsPage from '@/pages/SalesListingsPage';
import CRMPage from '@/pages/CRMPage';
import PropertyManagementDashboard from '@/pages/PropertyManagementDashboard';
import LeasingDashboard from '@/pages/LeasingDashboard';
import ContactsPage from '@/pages/ContactsPage';
import PropertiesPage from '@/pages/PropertiesPage';
import MessagesPage from '@/pages/MessagesPage';
import SignalsPage from '@/pages/SignalsPage';
import TasksPage from '@/pages/TasksPage';
import ServiceRequestsPage from '@/pages/ServiceRequestsPage';
import InspectionsPage from '@/pages/InspectionsPage';
import ApplicationsPage from '@/pages/ApplicationsPage';
import LandlordPacksPage from '@/pages/LandlordPacksPage';
import AutomationPage from '@/pages/AutomationPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import UsersPage from '@/pages/UsersPage';
import SettingsPage from '@/pages/SettingsPage';
import AuditLogsPage from '@/pages/AuditLogsPage';

import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Role-based home redirect
function RoleHomeDashboard() {
  const { userRole, loading } = useUser();
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }
  switch (userRole) {
    case ROLES.OWNER: return <OwnerDashboard />;
    case ROLES.PROPERTY_MANAGER: return <PropertyManagementDashboard />;
    case ROLES.LEASING: return <LeasingDashboard />;
    default: return <SalesDashboard />;
  }
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <UserProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<RoleHomeDashboard />} />
            <Route path="/sales" element={<SalesDashboard />} />
            <Route path="/sales-listings" element={<SalesListingsPage />} />
            <Route path="/crm" element={<CRMPage />} />
            <Route path="/property-management" element={<PropertyManagementDashboard />} />
            <Route path="/leasing" element={<LeasingDashboard />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/signals" element={<SignalsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/service-requests" element={<ServiceRequestsPage />} />
            <Route path="/inspections" element={<InspectionsPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/landlord-packs" element={<LandlordPacksPage />} />
            <Route path="/automation" element={<AutomationPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            {/* Aliases for sidebar nav */}
            <Route path="/landlords" element={<ContactsPage />} />
            <Route path="/tenants" element={<ContactsPage />} />
            <Route path="/contractors" element={<ContactsPage />} />
            <Route path="/buyers" element={<ContactsPage />} />
            <Route path="/sellers" element={<ContactsPage />} />
            <Route path="/applicants" element={<ContactsPage />} />
            <Route path="/quotes" element={<ServiceRequestsPage />} />
            <Route path="/onboarding" element={<ServiceRequestsPage />} />
            <Route path="/workflows" element={<AutomationPage />} />
            <Route path="/appraisals" element={<SalesDashboard />} />
            <Route path="/listings" element={<SalesDashboard />} />
            <Route path="/agreements" element={<ApplicationsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </UserProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;