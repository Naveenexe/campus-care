import React from 'react';

const priorityConfig = {
  urgent: { label: 'URGENT', stampClass: 'stamp-urgent' },
  high: { label: 'HIGH', stampClass: 'stamp-high' },
  medium: { label: 'MEDIUM', stampClass: 'stamp-medium' },
  low: { label: 'LOW', stampClass: 'stamp-low' },
};

export default function PriorityBadge({ priority, isCardStamp = false }) {
  const norm = (priority || 'medium').toLowerCase();
  const cfg = priorityConfig[norm] || priorityConfig.medium;

  return (
    <span
      className={`stamp-badge ${cfg.stampClass} ${isCardStamp ? 'ticket-card-stamp' : ''}`}
      title={`Priority: ${cfg.label}`}
    >
      {cfg.label}
    </span>
  );
}
