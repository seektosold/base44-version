import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '@/lib/userContext';
import { ROLES, ROLE_LABELS, getRoleColor } from '@/lib/roles';
import {
  LayoutDashboard, Users, Building2, MessageSquare, Workflow,
  Zap, CheckSquare, BarChart3, Settings, FileText, Shield,
  Home, TrendingUp, Wrench, Key, UserCheck, Bell, ChevronDown,
  ChevronRight, LogOut, Bot, Clock, AlertTriangle
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const ownerNav = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Building2, label: 'Sales Listings', href: '/sales-listings' },
  { icon: Users, label: 'CRM', href: '/crm' },
  { icon: Wrench, label: 'Property Management', href: '/property-management' },
  { icon: Key, label: 'Leasing', href: '/leasing' },
  { icon: Building2, label: 'Properties', href: '/properties' },
  { icon: MessageSquare, label: 'Messages', href: '/messages' },
  { icon: Workflow, label: 'Workflows', href: '/workflows' },
  { icon: Bot, label: 'Automation', href: '/automation' },
  { icon: Zap, label: 'Signals', href: '/signals' },
  { icon: CheckSquare, label: 'Tasks', href: '/tasks' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: Shield, label: 'Users & Permissions', href: '/users' },
  { icon: Settings, label: 'Settings', href: '/settings' },
  { icon: FileText, label: 'Audit Logs', href: '/audit-logs' },
];

const salesNav = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Building2, label: 'Sales Listings', href: '/sales-listings' },
  { icon: Users, label: 'CRM', href: '/crm' },
  { icon: Home, label: 'Appraisals', href: '/appraisals' },
  { icon: Zap, label: 'Signals', href: '/signals' },
  { icon: MessageSquare, label: 'Message Studio', href: '/messages' },
  { icon: CheckSquare, label: 'Tasks', href: '/tasks' },
  { icon: Bot, label: 'Automation', href: '/automation' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
];

const pmNav = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Building2, label: 'Properties', href: '/properties' },
  { icon: Users, label: 'Landlords', href: '/landlords' },
  { icon: UserCheck, label: 'Tenants', href: '/tenants' },
  { icon: Wrench, label: 'Service Requests', href: '/service-requests' },
  { icon: UserCheck, label: 'Contractors', href: '/contractors' },
  { icon: FileText, label: 'Quotes', href: '/quotes' },
  { icon: Key, label: 'Onboarding', href: '/onboarding' },
  { icon: MessageSquare, label: 'Messages', href: '/messages' },
  { icon: CheckSquare, label: 'Tasks', href: '/tasks' },
  { icon: Bot, label: 'Automation', href: '/automation' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
];

const leasingNav = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Building2, label: 'Properties', href: '/properties' },
  { icon: Clock, label: 'Inspections', href: '/inspections' },
  { icon: Users, label: 'Applicants', href: '/applicants' },
  { icon: FileText, label: 'Applications', href: '/applications' },
  { icon: Shield, label: 'Landlord Packs', href: '/landlord-packs' },
  { icon: Key, label: 'Agreements', href: '/agreements' },
  { icon: MessageSquare, label: 'Messages', href: '/messages' },
  { icon: CheckSquare, label: 'Tasks', href: '/tasks' },
  { icon: Bot, label: 'Automation', href: '/automation' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
];

function getNavItems(role) {
  switch (role) {
    case ROLES.OWNER: return ownerNav;
    case ROLES.SALES: return salesNav;
    case ROLES.PROPERTY_MANAGER: return pmNav;
    case ROLES.LEASING: return leasingNav;
    default: return salesNav;
  }
}

export default function Sidebar({ collapsed, onToggle }) {
  const { currentUser, userProfile, userRole } = useUser();
  const location = useLocation();
  const navItems = getNavItems(userRole);

  const handleLogout = () => {
    base44.auth.logout('/login');
  };

  return (
    <div className={cn(
      "flex flex-col h-screen bg-[hsl(var(--sidebar-background))] text-sidebar-foreground transition-all duration-300 border-r border-sidebar-border",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
          <Home className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-bold text-white leading-tight">Seek to Sold</div>
            <div className="text-xs text-sidebar-foreground/60">Agent Portal</div>
          </div>
        )}
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-amber-400">
                {(currentUser?.full_name || 'U')[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{currentUser?.full_name || 'User'}</div>
              <div className={cn("text-xs px-1.5 py-0.5 rounded-full inline-block mt-0.5", getRoleColor(userRole))}>
                {ROLE_LABELS[userRole] || userRole}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "sidebar-nav",
                isActive ? "sidebar-nav-active" : "sidebar-nav-inactive",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-sidebar-border space-y-0.5">
        <button
          onClick={handleLogout}
          className={cn("sidebar-nav sidebar-nav-inactive w-full", collapsed && "justify-center px-2")}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}