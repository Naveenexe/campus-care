import React from 'react';
import { AlertOctagon, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function SlaBadge({ slaStatus }) {
  const norm = slaStatus || 'On Track';

  if (norm === 'Overdue') {
    return (
      <span className="badge-sla badge-sla-overdue" title="Resolution target breached">
        <AlertOctagon size={12} strokeWidth={2.5} />
        OVERDUE
      </span>
    );
  }

  if (norm === 'Approaching Deadline') {
    return (
      <span className="badge-sla badge-sla-approaching" title="Approaching SLA deadline">
        <Clock size={12} strokeWidth={2.5} />
        DUE SOON
      </span>
    );
  }

  if (norm === 'Completed') {
    return (
      <span className="badge-sla badge-sla-completed" title="SLA successfully met">
        <CheckCircle2 size={12} strokeWidth={2} />
        MET
      </span>
    );
  }

  return (
    <span className="badge-sla badge-sla-on-track" title="Within response timeline">
      <ShieldCheck size={12} strokeWidth={2} />
      ON TRACK
    </span>
  );
}
