import React from 'react';
import { useUser } from '@/lib/userContext';
import { ROLES } from '@/lib/roles';
import OwnerDashboard from './OwnerDashboard';
import SalesDashboard from './SalesDashboard';
import PropertyManagementDashboard from './PropertyManagementDashboard';
import LeasingDashboard from './LeasingDashboard';

export default function RoleDashboard() {
  const { userRole, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  switch (userRole) {
    case ROLES.OWNER: return <OwnerDashboard />;
    case ROLES.SALES: return <SalesDashboard />;
    case ROLES.PROPERTY_MANAGER: return <PropertyManagementDashboard />;
    case ROLES.LEASING: return <LeasingDashboard />;
    default: return <SalesDashboard />;
  }
}