import React from 'react';

const statusLabels = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_for_student: 'Waiting for Student',
  resolved: 'Resolved',
  closed: 'Closed',
};

export default function StatusBadge({ status }) {
  const normalized = (status || 'open').toLowerCase();
  const label = statusLabels[normalized] || status;

  return (
    <span className={`badge badge-status-${normalized}`}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: 'currentColor'
      }} />
      {label}
    </span>
  );
}
