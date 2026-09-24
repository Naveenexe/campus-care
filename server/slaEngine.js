const db = require('./db');

/**
 * Get SLA Policy for a given priority
 */
function getPolicy(priority) {
  const policy = db.prepare('SELECT * FROM sla_policies WHERE priority = ? AND is_active = 1').get(priority);
  if (policy) return policy;

  // Fallback defaults if not in DB
  const defaults = {
    low: { first_response_minutes: 1440, resolution_minutes: 4320, pause_while_waiting: 1 },
    medium: { first_response_minutes: 480, resolution_minutes: 2880, pause_while_waiting: 1 },
    high: { first_response_minutes: 120, resolution_minutes: 1440, pause_while_waiting: 1 },
    urgent: { first_response_minutes: 30, resolution_minutes: 240, pause_while_waiting: 1 },
  };
  return defaults[priority.toLowerCase()] || defaults.medium;
}

/**
 * Calculate due dates for a ticket given priority and creation time
 */
function calculateDeadlines(priority, startTime = new Date()) {
  const policy = getPolicy(priority);
  const start = new Date(startTime).getTime();

  const firstResponseDue = new Date(start + policy.first_response_minutes * 60 * 1000).toISOString();
  const resolutionDue = new Date(start + policy.resolution_minutes * 60 * 1000).toISOString();

  return {
    first_response_due_at: firstResponseDue,
    resolution_due_at: resolutionDue,
  };
}

/**
 * Determine dynamic SLA status for a ticket
 * Statuses: 'Completed', 'Overdue', 'Approaching Deadline', 'On Track'
 */
function evaluateSlaStatus(ticket) {
  if (['resolved', 'closed'].includes(ticket.status)) {
    return 'Completed';
  }

  const now = Date.now();
  const resDue = ticket.resolution_due_at ? new Date(ticket.resolution_due_at).getTime() : null;
  const respDue = ticket.first_response_due_at ? new Date(ticket.first_response_due_at).getTime() : null;

  // Check Overdue
  const isResolutionOverdue = resDue && now > resDue;
  const isResponseOverdue = !ticket.first_responded_at && respDue && now > respDue;

  if (isResolutionOverdue || isResponseOverdue) {
    return 'Overdue';
  }

  // Check Approaching Deadline (within 2 hours or within 20% of remaining resolution time)
  if (resDue) {
    const timeLeft = resDue - now;
    if (timeLeft > 0 && timeLeft <= 2 * 60 * 60 * 1000) {
      return 'Approaching Deadline';
    }
  }

  if (!ticket.first_responded_at && respDue) {
    const respTimeLeft = respDue - now;
    if (respTimeLeft > 0 && respTimeLeft <= 45 * 60 * 1000) {
      return 'Approaching Deadline';
    }
  }

  return 'On Track';
}

/**
 * Helper to enrich ticket object with SLA state & flags
 */
function enrichTicketWithSla(ticket) {
  if (!ticket) return null;
  const sla_status = evaluateSlaStatus(ticket);
  const is_overdue = sla_status === 'Overdue';
  const is_approaching = sla_status === 'Approaching Deadline';

  return {
    ...ticket,
    sla_status,
    is_overdue,
    is_approaching,
  };
}

module.exports = {
  getPolicy,
  calculateDeadlines,
  evaluateSlaStatus,
  enrichTicketWithSla,
};
