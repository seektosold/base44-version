export const ROLES = {
  OWNER: 'owner',
  SALES: 'sales',
  PROPERTY_MANAGER: 'property_manager',
  LEASING: 'leasing',
};

export const ROLE_LABELS = {
  owner: 'Owner',
  sales: 'Sales Agent',
  property_manager: 'Property Manager',
  leasing: 'Leasing Agent',
};

export const MODULE_TYPES = {
  SALES: 'sales',
  PM: 'property_management',
  LEASING: 'leasing',
  OWNER: 'owner_admin',
  SHARED: 'shared',
};

export function canAccessModule(userRole, moduleType) {
  if (userRole === ROLES.OWNER) return true;
  if (moduleType === MODULE_TYPES.SHARED) return true;
  if (userRole === ROLES.SALES && moduleType === MODULE_TYPES.SALES) return true;
  if (userRole === ROLES.PROPERTY_MANAGER && moduleType === MODULE_TYPES.PM) return true;
  if (userRole === ROLES.LEASING && moduleType === MODULE_TYPES.LEASING) return true;
  return false;
}

export function getRoleColor(role) {
  switch (role) {
    case ROLES.OWNER: return 'bg-purple-100 text-purple-800';
    case ROLES.SALES: return 'bg-blue-100 text-blue-800';
    case ROLES.PROPERTY_MANAGER: return 'bg-green-100 text-green-800';
    case ROLES.LEASING: return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusColor(status) {
  const colors = {
    drafted: 'bg-gray-100 text-gray-700',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    scheduled: 'bg-blue-100 text-blue-800',
    queued: 'bg-blue-100 text-blue-700',
    sent: 'bg-green-100 text-green-700',
    delivered: 'bg-green-100 text-green-800',
    replied: 'bg-purple-100 text-purple-800',
    bounced: 'bg-red-100 text-red-700',
    failed: 'bg-red-100 text-red-800',
    suppressed: 'bg-gray-200 text-gray-600',
    opted_out: 'bg-orange-100 text-orange-800',
    provider_not_connected: 'bg-orange-100 text-orange-700',
    new: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    urgent: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    automation_blocked: 'bg-red-100 text-red-800',
    full_auto: 'bg-green-100 text-green-800',
    approval: 'bg-yellow-100 text-yellow-800',
    hybrid: 'bg-blue-100 text-blue-800',
    escalated: 'bg-red-100 text-red-800',
    waiting: 'bg-gray-100 text-gray-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getUrgencyColor(urgency) {
  switch (urgency) {
    case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
    case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'routine': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'low': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}