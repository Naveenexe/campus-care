const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireRole } = require('../auth');
const { enrichTicketWithSla } = require('../slaEngine');

// GET /api/reports/analytics
router.get('/analytics', authenticate, requireRole('admin', 'staff'), (req, res) => {
  const { date_from, date_to } = req.query;

  let query = `
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
    WHERE 1=1
  `;
  const params = [];
  if (date_from) {
    query += ' AND t.created_at >= ?';
    params.push(date_from);
  }
  if (date_to) {
    query += ' AND t.created_at <= ?';
    params.push(date_to);
  }
  query += ' ORDER BY t.created_at DESC';

  const rows = db.prepare(query).all(...params);
  const enriched = rows.map(enrichTicketWithSla);

  // Resolution metrics
  const resolved = enriched.filter(t => t.resolved_at);
  let totalResolutionHours = 0;
  let compliantCount = 0;

  for (const t of resolved) {
    const created = new Date(t.created_at).getTime();
    const resolvedTime = new Date(t.resolved_at).getTime();
    totalResolutionHours += (resolvedTime - created) / (1000 * 60 * 60);

    if (!t.resolution_due_at || resolvedTime <= new Date(t.resolution_due_at).getTime()) {
      compliantCount++;
    }
  }

  const avgResolutionHours = resolved.length > 0 ? parseFloat((totalResolutionHours / resolved.length).toFixed(1)) : 0;
  const slaCompliance = resolved.length > 0 ? Math.round((compliantCount / resolved.length) * 100) : 100;

  // Breakdown by priority
  const priorityStats = {
    urgent: { count: 0, resolved: 0, breached: 0 },
    high: { count: 0, resolved: 0, breached: 0 },
    medium: { count: 0, resolved: 0, breached: 0 },
    low: { count: 0, resolved: 0, breached: 0 },
  };

  enriched.forEach(t => {
    if (priorityStats[t.priority]) {
      priorityStats[t.priority].count++;
      if (['resolved', 'closed'].includes(t.status)) priorityStats[t.priority].resolved++;
      if (t.is_overdue) priorityStats[t.priority].breached++;
    }
  });

  res.json({
    summary: {
      total_tickets: enriched.length,
      resolved_tickets: resolved.length,
      avg_resolution_hours: avgResolutionHours,
      sla_compliance_rate: slaCompliance,
    },
    priority_stats: priorityStats,
  });
});

// GET /api/reports/export-csv - Download CSV of filtered tickets (FR-049)
router.get('/export-csv', authenticate, requireRole('admin', 'staff'), (req, res) => {
  const { date_from, date_to, category_id, status } = req.query;

  let query = `
    SELECT
      t.*,
      req.full_name as requester_name,
      req.email as requester_email,
      staff.full_name as assignee_name,
      c.name as category_name,
      d.name as department_name
    FROM tickets t
    JOIN users req ON t.requester_id = req.id
    LEFT JOIN users staff ON t.assigned_to_id = staff.id
    LEFT JOIN ticket_categories c ON t.category_id = c.id
    LEFT JOIN departments d ON t.department_id = d.id
    WHERE 1=1
  `;
  const params = [];
  if (date_from) {
    query += ' AND t.created_at >= ?';
    params.push(date_from);
  }
  if (date_to) {
    query += ' AND t.created_at <= ?';
    params.push(date_to);
  }
  if (category_id && category_id !== 'all') {
    query += ' AND t.category_id = ?';
    params.push(category_id);
  }
  if (status && status !== 'all') {
    query += ' AND t.status = ?';
    params.push(status);
  }

  query += ' ORDER BY t.created_at DESC';

  const rows = db.prepare(query).all(...params);
  const enriched = rows.map(enrichTicketWithSla);

  // Build CSV content
  const headers = [
    'Ticket Number',
    'Subject',
    'Requester Name',
    'Requester Email',
    'Department',
    'Category',
    'Priority',
    'Status',
    'Assignee',
    'SLA State',
    'Created Date',
    'First Response Date',
    'Resolved Date',
    'Resolution Summary'
  ];

  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    const clean = String(str).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const lines = [headers.join(',')];
  for (const t of enriched) {
    lines.push([
      escapeCsv(t.ticket_number),
      escapeCsv(t.subject),
      escapeCsv(t.requester_name),
      escapeCsv(t.requester_email),
      escapeCsv(t.department_name || 'N/A'),
      escapeCsv(t.category_name),
      escapeCsv(t.priority.toUpperCase()),
      escapeCsv(t.status.replace(/_/g, ' ').toUpperCase()),
      escapeCsv(t.assignee_name || 'Unassigned'),
      escapeCsv(t.sla_status),
      escapeCsv(t.created_at),
      escapeCsv(t.first_responded_at || 'N/A'),
      escapeCsv(t.resolved_at || 'N/A'),
      escapeCsv(t.resolution_summary || '')
    ].join(','));
  }

  const csvOutput = lines.join('\r\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=campuscare_tickets_${Date.now()}.csv`);
  res.status(200).send(csvOutput);
});

module.exports = router;
