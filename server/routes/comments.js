const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');
const { authenticate } = require('../auth');

// POST /api/tickets/:ticketId/comments
router.post('/:ticketId/comments', authenticate, (req, res) => {
  const ticketId = parseInt(req.params.ticketId, 10);
  const { content, visibility = 'public' } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content cannot be empty' });
  }

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  // Student RBAC
  if (req.user.role === 'student') {
    if (ticket.requester_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You cannot comment on another student ticket' });
    }
    // Students can NEVER add internal notes (BR-006, FR-026, T-008)
    if (visibility === 'internal') {
      return res.status(403).json({ error: 'Forbidden: Students are not authorized to add internal notes' });
    }
  }

  const safeVisibility = ['public', 'internal'].includes(visibility) ? visibility : 'public';
  const now = new Date().toISOString();

  const commentTx = db.transaction(() => {
    // 1. Insert comment
    const result = db.prepare(`
      INSERT INTO ticket_comments (ticket_id, author_id, content, visibility, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(ticketId, req.user.id, content.trim(), safeVisibility, now, now);

    // 2. If student replies while waiting for student, transition ticket back to in_progress (FR-020)
    if (req.user.role === 'student' && ticket.status === 'waiting_for_student') {
      db.prepare(`
        UPDATE tickets
        SET status = 'in_progress', next_action_owner = 'staff', updated_at = ?
        WHERE id = ?
      `).run(now, ticketId);

      db.prepare(`
        INSERT INTO ticket_history (ticket_id, actor_id, action_type, old_value, new_value, description, created_at)
        VALUES (?, ?, 'status_change', 'waiting_for_student', 'in_progress', 'Student replied with requested information', ?)
      `).run(ticketId, req.user.id, now);
    }

    // 3. If staff makes first public reply, record first_responded_at (FR-032)
    if (['staff', 'admin'].includes(req.user.role) && safeVisibility === 'public' && !ticket.first_responded_at) {
      db.prepare(`
        UPDATE tickets
        SET first_responded_at = ?, updated_at = ?
        WHERE id = ?
      `).run(now, now, ticketId);

      db.prepare(`
        INSERT INTO ticket_history (ticket_id, actor_id, action_type, old_value, new_value, description, created_at)
        VALUES (?, ?, 'first_response', null, ?, 'First public staff response recorded for SLA tracking', ?)
      `).run(ticketId, req.user.id, now, now);
    }

    // 4. Update ticket updated_at
    db.prepare('UPDATE tickets SET updated_at = ? WHERE id = ?').run(now, ticketId);

    // 5. Send In-App Notifications
    if (safeVisibility === 'public') {
      if (req.user.role === 'student' && ticket.assigned_to_id) {
        db.prepare(`
          INSERT INTO notifications (user_id, ticket_id, type, message, created_at)
          VALUES (?, ?, 'student_reply', ?, ?)
        `).run(ticket.assigned_to_id, ticketId, `New reply from student on ticket ${ticket.ticket_number}.`, now);
      } else if (['staff', 'admin'].includes(req.user.role) && ticket.requester_id !== req.user.id) {
        db.prepare(`
          INSERT INTO notifications (user_id, ticket_id, type, message, created_at)
          VALUES (?, ?, 'staff_reply', ?, ?)
        `).run(ticket.requester_id, ticketId, `Staff replied on your ticket ${ticket.ticket_number}.`, now);
      }
    }

    return result.lastInsertRowid;
  });

  try {
    const commentId = commentTx();
    const comment = db.prepare(`
      SELECT tc.*, u.full_name as author_name, u.role as author_role
      FROM ticket_comments tc
      JOIN users u ON tc.author_id = u.id
      WHERE tc.id = ?
    `).get(commentId);

    res.status(201).json({ message: 'Comment added successfully', comment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to post comment: ' + err.message });
  }
});

module.exports = router;
