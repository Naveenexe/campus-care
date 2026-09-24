const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../auth');
const { enrichTicketWithSla } = require('../slaEngine');

// GET /api/dashboard/admin
router.get('/admin', authenticate, (req, res) => {
  const { date_from, date_to } = req.query;

  let dateFilter = '';
  const dateParams = [];
  if (date_from) {
    dateFilter += ' AND t.created_at >= ?';
    dateParams.push(date_from);
  }
  if (date_to) {
    dateFilter += ' AND t.created_at <= ?';
    dateParams.push(date_to);
  }

  // 1. All tickets for SLA evaluation and calculations
  const allTickets = db.prepare(`
    SELECT
      t.*,
      req.full_name as requester_name,
      staff.full_name as assignee_name,
      c.name as category_name,
      d.name as department_name
    FROM tickets t
    JOIN users req ON t.requester_id = req.id
    LEFT JOIN users staff ON t.assigned_to_id = staff.id
    LEFT JOIN ticket_categories c ON t.category_id = c.id
    LEFT JOIN departments d ON t.department_id = d.id
    WHERE 1=1 ${dateFilter}
    ORDER BY t.created_at DESC
  `).all(...dateParams);

  const enrichedTickets = allTickets.map(enrichTicketWithSla);

  // 2. Metrics calculation
  const total = enrichedTickets.length;
  const openCount = enrichedTickets.filter(t => t.status === 'open').length;
  const inProgressCount = enrichedTickets.filter(t => t.status === 'in_progress').length;
  const waitingCount = enrichedTickets.filter(t => t.status === 'waiting_for_student').length;
  const resolvedCount = enrichedTickets.filter(t => t.status === 'resolved').length;
  const closedCount = enrichedTickets.filter(t => t.status === 'closed').length;
  const overdueCount = enrichedTickets.filter(t => t.is_overdue).length;
  const approachingCount = enrichedTickets.filter(t => t.is_approaching).length;

  // Average resolution time (in hours) for resolved/closed tickets
  const resolvedTickets = enrichedTickets.filter(t => t.resolved_at);
  let avgResolutionHours = 0;
  if (resolvedTickets.length > 0) {
    const totalHours = resolvedTickets.reduce((acc, t) => {
      const created = new Date(t.created_at).getTime();
      const resolved = new Date(t.resolved_at).getTime();
      return acc + (resolved - created) / (1000 * 60 * 60);
    }, 0);
    avgResolutionHours = parseFloat((totalHours / resolvedTickets.length).toFixed(1));
  }

  // SLA Compliance Rate
  // Compliance = (resolved tickets that did not breach resolution SLA) / total resolved * 100
  let slaComplianceRate = 100;
  if (resolvedTickets.length > 0) {
    const compliantCount = resolvedTickets.filter(t => {
      if (!t.resolution_due_at) return true;
      return new Date(t.resolved_at).getTime() <= new Date(t.resolution_due_at).getTime();
    }).length;
    slaComplianceRate = Math.round((compliantCount / resolvedTickets.length) * 100);
  }

  // 3. Status Breakdown
  const statusBreakdown = {
    open: openCount,
    in_progress: inProgressCount,
    waiting_for_student: waitingCount,
    resolved: resolvedCount,
    closed: closedCount,
  };

  // 4. Priority Breakdown
  const priorityBreakdown = {
    urgent: enrichedTickets.filter(t => t.priority === 'urgent').length,
    high: enrichedTickets.filter(t => t.priority === 'high').length,
    medium: enrichedTickets.filter(t => t.priority === 'medium').length,
    low: enrichedTickets.filter(t => t.priority === 'low').length,
  };

  // 5. Category Breakdown
  const categoryCounts = {};
  for (const t of enrichedTickets) {
    const catName = t.category_name || 'General';
    categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
  }

  // 6. Staff Workload
  const staffWorkload = db.prepare(`
    SELECT
      u.id,
      u.full_name,
      d.name as department_name,
      COUNT(CASE WHEN t.status IN ('open', 'in_progress', 'waiting_for_student') THEN 1 END) as active_tickets,
      COUNT(CASE WHEN t.status IN ('resolved', 'closed') THEN 1 END) as completed_tickets
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN tickets t ON t.assigned_to_id = u.id
    WHERE u.role = 'staff' AND u.is_active = 1
    GROUP BY u.id
    ORDER BY active_tickets DESC
  `).all();

  // 7. Ticket Ageing Bins (FR-044)
  // Categories: <24 hours, 1–3 days, 3–7 days, >7 days (for active tickets)
  const activeTickets = enrichedTickets.filter(t => ['open', 'in_progress', 'waiting_for_student'].includes(t.status));
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  const ageingBins = {
    under_24h: 0,
    one_to_three_days: 0,
    three_to_seven_days: 0,
    over_seven_days: 0,
  };

  for (const t of activeTickets) {
    const ageDays = (now - new Date(t.created_at).getTime()) / ONE_DAY;
    if (ageDays < 1) ageingBins.under_24h++;
    else if (ageDays < 3) ageingBins.one_to_three_days++;
    else if (ageDays < 7) ageingBins.three_to_seven_days++;
    else ageingBins.over_seven_days++;
  }

  // 8. Overdue Tickets preview
  const overdueTickets = enrichedTickets.filter(t => t.is_overdue).slice(0, 5);

  // 9. Recent Activity Timeline
  const recentActivity = db.prepare(`
    SELECT th.*, u.full_name as actor_name, t.ticket_number, t.subject
    FROM ticket_history th
    LEFT JOIN users u ON th.actor_id = u.id
    JOIN tickets t ON th.ticket_id = t.id
    ORDER BY th.created_at DESC
    LIMIT 8
  `).all();

  res.json({
    kpis: {
      total,
      open: openCount,
      in_progress: inProgressCount,
      waiting_for_student: waitingCount,
      resolved: resolvedCount,
      closed: closedCount,
      overdue: overdueCount,
      approaching: approachingCount,
      avg_resolution_hours: avgResolutionHours,
      sla_compliance_rate: slaComplianceRate,
    },
    status_breakdown: statusBreakdown,
    priority_breakdown: priorityBreakdown,
    category_breakdown: categoryCounts,
    staff_workload: staffWorkload,
    ageing_bins: ageingBins,
    overdue_tickets: overdueTickets,
    recent_activity: recentActivity,
  });
});

// GET /api/dashboard/staff
router.get('/staff', authenticate, (req, res) => {
  const staffId = req.user.id;
  const deptId = req.user.department_id;

  const tickets = db.prepare(`
    SELECT
      t.*,
      req.full_name as requester_name,
      c.name as category_name,
      d.name as department_name
    FROM tickets t
    JOIN users req ON t.requester_id = req.id
    LEFT JOIN ticket_categories c ON t.category_id = c.id
    LEFT JOIN departments d ON t.department_id = d.id
    WHERE t.assigned_to_id = ? OR (t.assigned_to_id IS NULL AND t.department_id = ?)
    ORDER BY t.created_at DESC
  `).all(staffId, deptId);

  const enriched = tickets.map(enrichTicketWithSla);

  const myAssigned = enriched.filter(t => t.assigned_to_id === staffId);
  const myActive = myAssigned.filter(t => ['open', 'in_progress', 'waiting_for_student'].includes(t.status));
  const myOverdue = myAssigned.filter(t => t.is_overdue);
  const myApproaching = myAssigned.filter(t => t.is_approaching);
  const unassignedDept = enriched.filter(t => !t.assigned_to_id);

  res.json({
    kpis: {
      assigned_total: myAssigned.length,
      active_pending: myActive.length,
      overdue: myOverdue.length,
      approaching_sla: myApproaching.length,
      unassigned_in_department: unassignedDept.length,
    },
    my_active_tickets: myActive.slice(0, 10),
    overdue_tickets: myOverdue,
    approaching_tickets: myApproaching,
    unassigned_tickets: unassignedDept.slice(0, 5),
  });
});

// GET /api/dashboard/student
router.get('/student', authenticate, (req, res) => {
  const studentId = req.user.id;

  const tickets = db.prepare(`
    SELECT
      t.*,
      staff.full_name as assignee_name,
      c.name as category_name,
      d.name as department_name
    FROM tickets t
    LEFT JOIN users staff ON t.assigned_to_id = staff.id
    LEFT JOIN ticket_categories c ON t.category_id = c.id
    LEFT JOIN departments d ON t.department_id = d.id
    WHERE t.requester_id = ?
    ORDER BY t.created_at DESC
  `).all(studentId);

  const enriched = tickets.map(enrichTicketWithSla);

  const total = enriched.length;
  const active = enriched.filter(t => ['open', 'in_progress', 'waiting_for_student'].includes(t.status));
  const waitingForMe = enriched.filter(t => t.status === 'waiting_for_student');
  const resolved = enriched.filter(t => ['resolved', 'closed'].includes(t.status));

  res.json({
    kpis: {
      total,
      active: active.length,
      waiting_for_you: waitingForMe.length,
      resolved: resolved.length,
    },
    recent_tickets: enriched.slice(0, 8),
  });
});

module.exports = router;
