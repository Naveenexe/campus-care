import React from 'react';
import { AlertOctagon, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function SlaBadge({ slaStatus }) {
  const norm = slaStatus || 'On Track';

  if (norm === 'Overdue') {
    return (
      <span className="badge badge-sla-overdue" title="Resolution or response SLA has been breached!">
        <AlertOctagon size={12} strokeWidth={2.5} />
        Overdue
      </span>
    );
  }

  if (norm === 'Approaching Deadline') {
    return (
      <span className="badge badge-sla-approaching" title="Approaching SLA deadline!">
        <Clock size={12} strokeWidth={2.5} />
        Approaching
      </span>
    );
  }

  if (norm === 'Completed') {
    return (
      <span className="badge badge-sla-completed">
        <CheckCircle2 size={12} strokeWidth={2} />
        Completed
      </span>
    );
  }

  return (
    <span className="badge badge-sla-on-track">
      <ShieldCheck size={12} strokeWidth={2} />
      On Track
    </span>
  );
}
