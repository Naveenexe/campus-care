const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireRole, hashPassword } = require('../auth');

// GET /api/staff - List all staff with department & workload metrics
router.get('/', authenticate, (req, res) => {
  const staff = db.prepare(`
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.role,
      u.department_id,
      u.student_or_employee_id,
      u.is_active,
      d.name as department_name,
      COUNT(CASE WHEN t.status IN ('open', 'in_progress', 'waiting_for_student') THEN 1 END) as active_workload,
      COUNT(CASE WHEN t.status IN ('resolved', 'closed') THEN 1 END) as resolved_count
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN tickets t ON t.assigned_to_id = u.id
    WHERE u.role = 'staff'
    GROUP BY u.id
    ORDER BY u.is_active DESC, active_workload ASC, u.full_name ASC
  `).all();

  res.json({ staff });
});

// GET /api/staff/recommendation?category_id=X - Suggest eligible staff based on workload (FR-016)
router.get('/recommendation', authenticate, (req, res) => {
  const { category_id } = req.query;

  let deptId = null;
  if (category_id) {
    const cat = db.prepare('SELECT department_id FROM ticket_categories WHERE id = ?').get(category_id);
    if (cat) deptId = cat.department_id;
  }

  // Find active staff member in the department with lowest open ticket workload
  let query = `
    SELECT
      u.id,
      u.full_name,
      u.email,
      d.name as department_name,
      COUNT(CASE WHEN t.status IN ('open', 'in_progress', 'waiting_for_student') THEN 1 END) as active_workload
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN tickets t ON t.assigned_to_id = u.id
    WHERE u.role = 'staff' AND u.is_active = 1
  `;

  const params = [];
  if (deptId) {
    query += ` AND (u.department_id = ? OR u.department_id IS NULL)`;
    params.push(deptId);
  }

  query += `
    GROUP BY u.id
    ORDER BY active_workload ASC, u.id ASC
    LIMIT 1
  `;

  const recommended = db.prepare(query).get(...params);
  res.json({ recommendation: recommended || null });
});

// PATCH /api/staff/:id - Update status / department (Admin only)
router.patch('/:id', authenticate, requireRole('admin'), (req, res) => {
  const staffId = parseInt(req.params.id, 10);
  const { is_active, department_id } = req.body;

  const staff = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'staff'").get(staffId);
  if (!staff) return res.status(404).json({ error: 'Staff member not found' });

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE users
    SET is_active = COALESCE(?, is_active),
        department_id = COALESCE(?, department_id),
        updated_at = ?
    WHERE id = ?
  `).run(is_active !== undefined ? (is_active ? 1 : 0) : null, department_id, now, staffId);

  const updated = db.prepare(`
    SELECT u.id, u.full_name, u.email, u.role, u.department_id, u.student_or_employee_id, u.is_active, d.name as department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = ?
  `).get(staffId);

  res.json({ message: 'Staff member updated successfully', staff: updated });
});

// POST /api/staff - Create new staff account (Admin only)
router.post('/', authenticate, requireRole('admin'), (req, res) => {
  const { full_name, email, password, department_id, employee_id } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const hash = hashPassword(password);
  const info = db.prepare(`
    INSERT INTO users (full_name, email, password_hash, role, department_id, student_or_employee_id)
    VALUES (?, ?, ?, 'staff', ?, ?)
  `).run(full_name.trim(), email.trim().toLowerCase(), hash, department_id || null, employee_id || null);

  const newStaff = db.prepare(`
    SELECT u.id, u.full_name, u.email, u.role, u.department_id, u.student_or_employee_id, u.is_active, d.name as department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = ?
  `).get(info.lastInsertRowid);

  res.status(201).json({ message: 'Staff account created successfully', staff: newStaff });
});

module.exports = router;
