const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireRole } = require('../auth');

// GET /api/settings/categories (Public for authenticated users)
router.get('/categories', authenticate, (req, res) => {
  const categories = db.prepare(`
    SELECT c.*, d.name as department_name
    FROM ticket_categories c
    LEFT JOIN departments d ON c.department_id = d.id
    ORDER BY c.name ASC
  `).all();
  res.json({ categories });
});

// POST /api/settings/categories (Admin only)
router.post('/categories', authenticate, requireRole('admin'), (req, res) => {
  const { name, description, department_id } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const info = db.prepare(`
      INSERT INTO ticket_categories (name, description, department_id)
      VALUES (?, ?, ?)
    `).run(name.trim(), description || '', department_id || null);

    const created = db.prepare(`
      SELECT c.*, d.name as department_name
      FROM ticket_categories c
      LEFT JOIN departments d ON c.department_id = d.id
      WHERE c.id = ?
    `).get(info.lastInsertRowid);

    res.status(201).json({ category: created });
  } catch (err) {
    res.status(400).json({ error: 'Category creation failed: ' + err.message });
  }
});

// PATCH /api/settings/categories/:id
router.patch('/categories/:id', authenticate, requireRole('admin'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, description, department_id, is_active } = req.body;

  db.prepare(`
    UPDATE ticket_categories
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        department_id = COALESCE(?, department_id),
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(name, description, department_id, is_active !== undefined ? (is_active ? 1 : 0) : null, id);

  const updated = db.prepare(`
    SELECT c.*, d.name as department_name
    FROM ticket_categories c
    LEFT JOIN departments d ON c.department_id = d.id
    WHERE c.id = ?
  `).get(id);

  res.json({ category: updated });
});

// GET /api/settings/sla-policies
router.get('/sla-policies', authenticate, (req, res) => {
  const policies = db.prepare('SELECT * FROM sla_policies ORDER BY id ASC').all();
  res.json({ policies });
});

// PUT /api/settings/sla-policies/:priority (Admin only)
router.put('/sla-policies/:priority', authenticate, requireRole('admin'), (req, res) => {
  const priority = req.params.priority.toLowerCase();
  const { first_response_minutes, resolution_minutes, pause_while_waiting } = req.body;

  if (first_response_minutes === undefined || resolution_minutes === undefined) {
    return res.status(400).json({ error: 'first_response_minutes and resolution_minutes are required' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE sla_policies
    SET first_response_minutes = ?,
        resolution_minutes = ?,
        pause_while_waiting = COALESCE(?, pause_while_waiting),
        updated_at = ?
    WHERE priority = ?
  `).run(
    parseInt(first_response_minutes, 10),
    parseInt(resolution_minutes, 10),
    pause_while_waiting !== undefined ? (pause_while_waiting ? 1 : 0) : null,
    now,
    priority
  );

  const updated = db.prepare('SELECT * FROM sla_policies WHERE priority = ?').get(priority);
  res.json({ message: 'SLA policy updated', policy: updated });
});

// GET /api/settings/departments
router.get('/departments', authenticate, (req, res) => {
  const departments = db.prepare('SELECT * FROM departments ORDER BY name ASC').all();
  res.json({ departments });
});

// POST /api/settings/departments (Admin only)
router.post('/departments', authenticate, requireRole('admin'), (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Department name is required' });

  try {
    const info = db.prepare('INSERT INTO departments (name, description) VALUES (?, ?)').run(name.trim(), description || '');
    const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ department: dept });
  } catch (err) {
    res.status(400).json({ error: 'Department creation failed: ' + err.message });
  }
});

module.exports = router;
