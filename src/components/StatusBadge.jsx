import React from 'react';

const statusLabels = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_for_student: 'Waiting for Student',
  resolved: 'Resolved',
  closed: 'Closed',
};

export default function StatusBadge({ status, isActive = false, animateSettle = false }) {
  const normalized = (status || 'open').toLowerCase();
  const label = statusLabels[normalized] || status;

  return (
    <span
      className={`badge-status badge-status-${normalized} ${isActive ? 'badge-status-active' : ''} ${animateSettle ? 'stamp-settling' : ''}`}
      title={`Current Status: ${label}`}
    >
      {label}
    </span>
  );
}
