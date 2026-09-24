const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../auth');

// GET /api/notifications
router.get('/', authenticate, (req, res) => {
  const notifications = db.prepare(`
    SELECT n.*, t.ticket_number
    FROM notifications n
    LEFT JOIN tickets t ON n.ticket_id = t.id
    WHERE n.user_id = ?
    ORDER BY n.is_read ASC, n.created_at DESC
    LIMIT 30
  `).all(req.user.id);

  const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).count;

  res.json({ notifications, unreadCount });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, (req, res) => {
  const id = parseInt(req.params.id, 10);
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, req.user.id);
  res.json({ message: 'Marked as read' });
});

// POST /api/notifications/mark-all-read
router.post('/mark-all-read', authenticate, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'All notifications marked as read' });
});

module.exports = router;
