import React from 'react';
import { getStatusColor } from '@/lib/roles';
import { cn } from '@/lib/utils';

export default function StatusPill({ status, label, className }) {
  const color = getStatusColor(status);
  const displayLabel = label || status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  return (
    <span className={cn("status-pill", color, className)}>
      {displayLabel}
    </span>
  );
}