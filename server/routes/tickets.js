const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireRole } = require('../auth');
const { calculateDeadlines, enrichTicketWithSla } = require('../slaEngine');

/**
 * Generate unique human-readable ticket number (e.g. CC-2026-00133)
 */
function generateTicketNumber() {
  const year = new Date().getFullYear();
  const lastTicket = db.prepare('SELECT ticket_number FROM tickets ORDER BY id DESC LIMIT 1').get();
  let nextSeq = 101;
  if (lastTicket && lastTicket.ticket_number) {
    const match = lastTicket.ticket_number.match(/CC-\d{4}-(\d+)/);
    if (match) {
      nextSeq = parseInt(match[1], 10) + 1;
    }
  }
  const padded = String(nextSeq).padStart(5, '0');
  return `CC-${year}-${padded}`;
}

// GET /api/tickets - List with advanced search, filters, pagination, and RBAC
router.get('/', authenticate, (req, res) => {
  const {
    search,
    status,
    priority,
    category_id,
    department_id,
    assigned_to_id,
    sla_state,
    sort_by = 'created_at',
    sort_order = 'desc',
    page = 1,
    limit = 15,
  } = req.query;

  const conditions = [];
  const params = [];

  // RBAC Ticket Visibility Filtering (FR-009, BR-005)
  if (req.user.role === 'student') {
    conditions.push('t.requester_id = ?');
    params.push(req.user.id);
  } else if (req.user.role === 'staff') {
    // Staff can view tickets assigned to them or within their department
    if (req.user.department_id) {
      conditions.push('(t.assigned_to_id = ? OR t.department_id = ? OR t.assigned_to_id IS NULL)');
      params.push(req.user.id, req.user.department_id);
    } else {
      conditions.push('(t.assigned_to_id = ? OR t.assigned_to_id IS NULL)');
      params.push(req.user.id);
    }
  }
  // Admin sees all tickets

  // Filter: Search (Ticket number, Subject, Requester Name)
  if (search && search.trim()) {
    conditions.push('(t.ticket_number LIKE ? OR t.subject LIKE ? OR req.full_name LIKE ?)');
    const searchTerm = `%${search.trim()}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  // Filter: Status
  if (status && status !== 'all') {
    conditions.push('t.status = ?');
    params.push(status);
  }

  // Filter: Priority
  if (priority && priority !== 'all') {
    conditions.push('t.priority = ?');
    params.push(priority);
  }

  // Filter: Category
  if (category_id && category_id !== 'all') {
    conditions.push('t.category_id = ?');
    params.push(parseInt(category_id, 10));
  }

  // Filter: Department
  if (department_id && department_id !== 'all') {
    conditions.push('t.department_id = ?');
    params.push(parseInt(department_id, 10));
  }

  // Filter: Assignee
  if (assigned_to_id && assigned_to_id !== 'all') {
    if (assigned_to_id === 'unassigned') {
      conditions.push('t.assigned_to_id IS NULL');
    } else {
      conditions.push('t.assigned_to_id = ?');
      params.push(parseInt(assigned_to_id, 10));
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Allowed sort columns
  const allowedSortCols = {
    created_at: 't.created_at',
    updated_at: 't.updated_at',
    priority: 't.priority',
    resolution_due_at: 't.resolution_due_at',
    status: 't.status',
    ticket_number: 't.id',
  };
  const sortCol = allowedSortCols[sort_by] || 't.created_at';
  const orderDirection = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const baseQuery = `
    SELECT
      t.*,
      req.full_name as requester_name,
      req.email as requester_email,
      req.student_or_employee_id as requester_identifier,
      staff.full_name as assignee_name,
      staff.email as assignee_email,
      c.name as category_name,
      d.name as department_name,
      (SELECT COUNT(*) FROM ticket_comments tc WHERE tc.ticket_id = t.id) as comment_count
    FROM tickets t
    JOIN users req ON t.requester_id = req.id
    LEFT JOIN users staff ON t.assigned_to_id = staff.id
    LEFT JOIN ticket_categories c ON t.category_id = c.id
    LEFT JOIN departments d ON t.department_id = d.id
    ${whereClause}
  `;

  // Fetch all matching rows for dynamic SLA filtering if needed
  const rows = db.prepare(`${baseQuery} ORDER BY ${sortCol} ${orderDirection}`).all(...params);

  // Enrich with dynamic SLA status
  let enriched = rows.map(enrichTicketWithSla);

  // Dynamic SLA state filter
  if (sla_state && sla_state !== 'all') {
    enriched = enriched.filter(t => {
      if (sla_state === 'overdue') return t.is_overdue;
      if (sla_state === 'approaching') return t.is_approaching;
      if (sla_state === 'on_track') return t.sla_status === 'On Track';
      if (sla_state === 'completed') return t.sla_status === 'Completed';
      return true;
    });
  }

  // Pagination
  const total = enriched.length;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.max(1, parseInt(limit, 10) || 15);
  const offset = (pageNum - 1) * pageSize;
  const paginated = enriched.slice(offset, offset + pageSize);

  res.json({
    tickets: paginated,
    pagination: {
      total,
      page: pageNum,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    }
  });
});

// GET /api/tickets/:id - Retrieve single ticket details with history and comments
router.get('/:id', authenticate, (req, res) => {
  const ticketId = parseInt(req.params.id, 10);
  const ticket = db.prepare(`
    SELECT
      t.*,
      req.full_name as requester_name,
      req.email as requester_email,
      req.student_or_employee_id as requester_identifier,
      staff.full_name as assignee_name,
      staff.email as assignee_email,
      c.name as category_name,
      d.name as department_name
    FROM tickets t
    JOIN users req ON t.requester_id = req.id
    LEFT JOIN users staff ON t.assigned_to_id = staff.id
    LEFT JOIN ticket_categories c ON t.category_id = c.id
    LEFT JOIN departments d ON t.department_id = d.id
    WHERE t.id = ?
  `).get(ticketId);

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  // RBAC access check
  if (req.user.role === 'student' && ticket.requester_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to view this ticket' });
  }

  // Comments (FR-026, BR-006: Filter out internal notes for students!)
  let commentsQuery = `
    SELECT
      tc.*,
      u.full_name as author_name,
      u.role as author_role
    FROM ticket_comments tc
    JOIN users u ON tc.author_id = u.id
    WHERE tc.ticket_id = ?
  `;

  if (req.user.role === 'student') {
    commentsQuery += ` AND tc.visibility = 'public'`;
  }

  commentsQuery += ` ORDER BY tc.created_at ASC`;
  const comments = db.prepare(commentsQuery).all(ticketId);

  // History timeline
  const history = db.prepare(`
    SELECT
      th.*,
      u.full_name as actor_name,
      u.role as actor_role
    FROM ticket_history th
    LEFT JOIN users u ON th.actor_id = u.id
    WHERE th.ticket_id = ?
    ORDER BY th.created_at ASC
  `).all(ticketId);

  const enrichedTicket = enrichTicketWithSla(ticket);

  res.json({
    ticket: enrichedTicket,
    comments,
    history,
  });
});

// POST /api/tickets - Create ticket (Students & Admins)
router.post('/', authenticate, (req, res) => {
  const { category_id, subject, description, priority = 'medium', attachment_url } = req.body;

  // Validation (FR-007, BR-003)
  if (!category_id || !subject || !description) {
    return res.status(400).json({ error: 'Category, subject, and description are required fields' });
  }

  if (subject.trim().length < 5) {
    return res.status(400).json({ error: 'Subject must be at least 5 characters long' });
  }

  if (description.trim().length < 10) {
    return res.status(400).json({ error: 'Description must be at least 10 characters long' });
  }

  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  const safePriority = validPriorities.includes(priority.toLowerCase()) ? priority.toLowerCase() : 'medium';

  // Lookup category and department
  const category = db.prepare('SELECT id, department_id, name FROM ticket_categories WHERE id = ? AND is_active = 1').get(category_id);
  if (!category) {
    return res.status(400).json({ error: 'Invalid or inactive ticket category' });
  }

  const ticketNumber = generateTicketNumber();
  const deadlines = calculateDeadlines(safePriority);
  const now = new Date().toISOString();

  // Suggest initial staff assignment (FR-016)
  let suggestedStaffId = null;
  const eligibleStaff = db.prepare(`
    SELECT u.id, COUNT(t.id) as active_workload
    FROM users u
    LEFT JOIN tickets t ON t.assigned_to_id = u.id AND t.status IN ('open', 'in_progress', 'waiting_for_student')
    WHERE u.role = 'staff' AND u.is_active = 1 AND (u.department_id = ? OR u.department_id IS NULL)
    GROUP BY u.id
    ORDER BY active_workload ASC, u.id ASC
    LIMIT 1
  `).get(category.department_id);

  if (eligibleStaff) {
    suggestedStaffId = eligibleStaff.id;
  }

  // Atomic creation of ticket and initial history (BR-012, 5.9)
  const createTx = db.transaction(() => {
    const insertStmt = db.prepare(`
      INSERT INTO tickets (
        ticket_number, requester_id, assigned_to_id, department_id, category_id,
        subject, description, priority, status, next_action_owner,
        first_response_due_at, resolution_due_at, attachment_url,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', 'manager', ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      ticketNumber,
      req.user.id,
      null, // unassigned initially until accepted or assigned
      category.department_id,
      category.id,
      subject.trim(),
      description.trim(),
      safePriority,
      deadlines.first_response_due_at,
      deadlines.resolution_due_at,
      attachment_url || null,
      now,
      now
    );

    const ticketId = result.lastInsertRowid;

    // Record creation in history
    db.prepare(`
      INSERT INTO ticket_history (ticket_id, actor_id, action_type, old_value, new_value, description, created_at)
      VALUES (?, ?, 'created', null, 'open', ?, ?)
    `).run(ticketId, req.user.id, `Ticket ${ticketNumber} created by ${req.user.full_name}`, now);

    // Notify Admins
    const admins = db.prepare("SELECT id FROM users WHERE role = 'admin' AND is_active = 1").all();
    for (const admin of admins) {
      db.prepare(`
        INSERT INTO notifications (user_id, ticket_id, type, message, created_at)
        VALUES (?, ?, 'new_ticket', ?, ?)
      `).run(admin.id, ticketId, `New ticket ${ticketNumber}: "${subject.trim().substring(0, 40)}" raised.`, now);
    }

    return ticketId;
  });

  try {
    const newTicketId = createTx();
    const createdTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(newTicketId);
    res.status(201).json({
      message: 'Ticket created successfully',
      ticket: enrichTicketWithSla(createdTicket),
      suggestedStaffId,
    });
  } catch (err) {
    console.error('Error creating ticket:', err);
    res.status(500).json({ error: 'Failed to create ticket: ' + err.message });
  }
});

// PATCH /api/tickets/:id/status - Role-based status transition
router.patch('/:id/status', authenticate, (req, res) => {
  const ticketId = parseInt(req.params.id, 10);
  const { status, resolution_summary } = req.body;

  const validStatuses = ['open', 'in_progress', 'waiting_for_student', 'resolved', 'closed'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid ticket status requested' });
  }

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  // Student cannot directly change status arbitrarily
  if (req.user.role === 'student' && status !== 'in_progress') {
    return res.status(403).json({ error: 'Students can only transition tickets by responding or reopening' });
  }

  // Moving to resolved REQUIRES resolution summary (FR-021, BR-007, T-009)
  if (status === 'resolved') {
    if (!resolution_summary || resolution_summary.trim().length < 5) {
      return res.status(400).json({ error: 'A resolution summary of at least 5 characters is required before resolving a ticket.' });
    }
  }

  const now = new Date().toISOString();
  let nextActionOwner = 'staff';
  let resolvedAt = ticket.resolved_at;
  let closedAt = ticket.closed_at;

  if (status === 'waiting_for_student') {
    nextActionOwner = 'student';
  } else if (status === 'resolved') {
    nextActionOwner = 'student';
    resolvedAt = now;
  } else if (status === 'closed') {
    nextActionOwner = 'staff';
    closedAt = now;
  } else if (status === 'open') {
    nextActionOwner = 'manager';
  }

  const updateTx = db.transaction(() => {
    db.prepare(`
      UPDATE tickets
      SET status = ?, resolution_summary = COALESCE(?, resolution_summary),
          next_action_owner = ?, resolved_at = ?, closed_at = ?, updated_at = ?
      WHERE id = ?
    `).run(status, resolution_summary ? resolution_summary.trim() : null, nextActionOwner, resolvedAt, closedAt, now, ticketId);

    // Record history
    db.prepare(`
      INSERT INTO ticket_history (ticket_id, actor_id, action_type, old_value, new_value, description, created_at)
      VALUES (?, ?, 'status_change', ?, ?, ?, ?)
    `).run(
      ticketId,
      req.user.id,
      ticket.status,
      status,
      `Status changed from ${ticket.status} to ${status}${resolution_summary ? ': ' + resolution_summary.trim() : ''}`,
      now
    );

    // Notify requester
    if (ticket.requester_id !== req.user.id) {
      db.prepare(`
        INSERT INTO notifications (user_id, ticket_id, type, message, created_at)
        VALUES (?, ?, 'status_change', ?, ?)
      `).run(ticket.requester_id, ticketId, `Your ticket ${ticket.ticket_number} status changed to ${status.replace(/_/g, ' ')}.`, now);
    }
  });

  try {
    updateTx();
    const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    res.json({ message: 'Ticket status updated', ticket: enrichTicketWithSla(updated) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status: ' + err.message });
  }
});

// PATCH /api/tickets/:id/assign - Assign or reassign ticket (Admin & Staff)
router.patch('/:id/assign', authenticate, requireRole('admin', 'staff'), (req, res) => {
  const ticketId = parseInt(req.params.id, 10);
  const { staff_id } = req.body;

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  let newStaff = null;
  if (staff_id) {
    newStaff = db.prepare("SELECT id, full_name, role, is_active FROM users WHERE id = ? AND role = 'staff' AND is_active = 1").get(staff_id);
    if (!newStaff) {
      return res.status(400).json({ error: 'Invalid or inactive staff member' });
    }
  }

  const oldStaff = ticket.assigned_to_id
    ? db.prepare('SELECT full_name FROM users WHERE id = ?').get(ticket.assigned_to_id)
    : null;

  const now = new Date().toISOString();
  const newStaffId = newStaff ? newStaff.id : null;
  const newStaffName = newStaff ? newStaff.full_name : 'Unassigned';
  const oldStaffName = oldStaff ? oldStaff.full_name : 'Unassigned';

  const assignTx = db.transaction(() => {
    db.prepare(`
      UPDATE tickets
      SET assigned_to_id = ?, updated_at = ?, next_action_owner = 'staff'
      WHERE id = ?
    `).run(newStaffId, now, ticketId);

    // Record history (FR-017)
    db.prepare(`
      INSERT INTO ticket_history (ticket_id, actor_id, action_type, old_value, new_value, description, created_at)
      VALUES (?, ?, 'assigned', ?, ?, ?, ?)
    `).run(ticketId, req.user.id, oldStaffName, newStaffName, `Ticket assigned to ${newStaffName} by ${req.user.full_name}`, now);

    // Notify assignee
    if (newStaffId && newStaffId !== req.user.id) {
      db.prepare(`
        INSERT INTO notifications (user_id, ticket_id, type, message, created_at)
        VALUES (?, ?, 'ticket_assigned', ?, ?)
      `).run(newStaffId, ticketId, `Ticket ${ticket.ticket_number} has been assigned to you.`, now);
    }
  });

  try {
    assignTx();
    const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    res.json({ message: 'Ticket assigned successfully', ticket: enrichTicketWithSla(updated) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign ticket: ' + err.message });
  }
});

// PATCH /api/tickets/:id/priority - Change priority (FR-035)
router.patch('/:id/priority', authenticate, requireRole('admin', 'staff'), (req, res) => {
  const ticketId = parseInt(req.params.id, 10);
  const { priority } = req.body;

  const valid = ['low', 'medium', 'high', 'urgent'];
  if (!priority || !valid.includes(priority.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid priority' });
  }

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const safePriority = priority.toLowerCase();
  const deadlines = calculateDeadlines(safePriority, ticket.created_at);
  const now = new Date().toISOString();

  const prioTx = db.transaction(() => {
    db.prepare(`
      UPDATE tickets
      SET priority = ?, first_response_due_at = ?, resolution_due_at = ?, updated_at = ?
      WHERE id = ?
    `).run(safePriority, deadlines.first_response_due_at, deadlines.resolution_due_at, now, ticketId);

    db.prepare(`
      INSERT INTO ticket_history (ticket_id, actor_id, action_type, old_value, new_value, description, created_at)
      VALUES (?, ?, 'priority_change', ?, ?, ?, ?)
    `).run(ticketId, req.user.id, ticket.priority, safePriority, `Priority updated to ${safePriority.toUpperCase()} by ${req.user.full_name}`, now);
  });

  try {
    prioTx();
    const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    res.json({ message: 'Priority updated', ticket: enrichTicketWithSla(updated) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update priority: ' + err.message });
  }
});

// POST /api/tickets/:id/reopen - Student reopens resolved/closed ticket (FR-023, T-011)
router.post('/:id/reopen', authenticate, (req, res) => {
  const ticketId = parseInt(req.params.id, 10);
  const { reason } = req.body;

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  // Only student requester or admin can reopen
  if (req.user.role === 'student' && ticket.requester_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden: You cannot reopen another student ticket' });
  }

  if (!['resolved', 'closed'].includes(ticket.status)) {
    return res.status(400).json({ error: 'Only resolved or closed tickets can be reopened' });
  }

  if (!reason || reason.trim().length < 5) {
    return res.status(400).json({ error: 'A valid reopening reason is required' });
  }

  const now = new Date().toISOString();

  const reopenTx = db.transaction(() => {
    db.prepare(`
      UPDATE tickets
      SET status = 'in_progress', next_action_owner = 'staff', reopen_count = reopen_count + 1, updated_at = ?
      WHERE id = ?
    `).run(now, ticketId);

    db.prepare(`
      INSERT INTO ticket_history (ticket_id, actor_id, action_type, old_value, new_value, description, created_at)
      VALUES (?, ?, 'reopened', ?, 'in_progress', ?, ?)
    `).run(ticketId, req.user.id, ticket.status, `Ticket reopened: ${reason.trim()}`, now);

    // Notify assigned staff or admin
    if (ticket.assigned_to_id) {
      db.prepare(`
        INSERT INTO notifications (user_id, ticket_id, type, message, created_at)
        VALUES (?, ?, 'ticket_reopened', ?, ?)
      `).run(ticket.assigned_to_id, ticketId, `Ticket ${ticket.ticket_number} was reopened: "${reason.trim().substring(0, 40)}"`, now);
    }
  });

  try {
    reopenTx();
    const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    res.json({ message: 'Ticket reopened successfully', ticket: enrichTicketWithSla(updated) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reopen ticket: ' + err.message });
  }
});

module.exports = router;
