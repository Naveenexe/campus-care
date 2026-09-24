import React from 'react';
import { AlertCircle, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';

const priorityConfig = {
  urgent: { label: 'Urgent', icon: AlertCircle, color: '#e11d48' },
  high: { label: 'High', icon: ArrowUp, color: '#ea580c' },
  medium: { label: 'Medium', icon: AlertTriangle, color: '#4f46e5' },
  low: { label: 'Low', icon: ArrowDown, color: '#0d9488' },
};

export default function PriorityBadge({ priority }) {
  const norm = (priority || 'medium').toLowerCase();
  const cfg = priorityConfig[norm] || priorityConfig.medium;
  const Icon = cfg.icon;

  return (
    <span className={`badge badge-priority-${norm}`}>
      <Icon size={12} strokeWidth={2.5} />
      {cfg.label}
    </span>
  );
}
