import React from 'react';
import { Bot, CheckSquare, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

const modeConfig = {
  full_auto: { icon: Bot, label: 'Full Auto', color: 'bg-green-100 text-green-800 border-green-200' },
  approval: { icon: CheckSquare, label: 'Approval Required', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  hybrid: { icon: Layers, label: 'Hybrid Mode', color: 'bg-blue-100 text-blue-800 border-blue-200' },
};

export default function AutomodeBadge({ mode, showLabel = true, size = 'sm' }) {
  const config = modeConfig[mode] || modeConfig.approval;
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border font-medium",
      config.color,
      size === 'xs' ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-1"
    )}>
      <Icon className={size === 'xs' ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {showLabel && config.label}
    </span>
  );
}