const express = require('express');
const router = express.Router();
const db = require('../db');
const { hashPassword, comparePassword, generateToken, authenticate } = require('../auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare(`
    SELECT u.*, d.name as department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE LOWER(u.email) = LOWER(?)
  `).get(email.trim());

  if (!user || !comparePassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (!user.is_active) {
    return res.status(403).json({ error: 'Account has been deactivated. Please contact an administrator.' });
  }

  const token = generateToken(user);
  const { password_hash, ...safeUser } = user;

  res.json({ token, user: safeUser });
});

// POST /api/auth/demo-login
router.post('/demo-login', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Demo email is required' });
  }

  const user = db.prepare(`
    SELECT u.*, d.name as department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE LOWER(u.email) = LOWER(?)
  `).get(email.trim());

  if (!user) {
    return res.status(404).json({ error: 'Demo account not found' });
  }

  const token = generateToken(user);
  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare(`
    SELECT u.id, u.full_name, u.email, u.role, u.department_id, u.student_or_employee_id, u.is_active, d.name as department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = ?
  `).get(req.user.id);

  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// GET /api/auth/demo-accounts
router.get('/demo-accounts', (req, res) => {
  const accounts = db.prepare(`
    SELECT u.id, u.full_name, u.email, u.role, u.student_or_employee_id, d.name as department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.is_active = 1
    ORDER BY
      CASE u.role
        WHEN 'admin' THEN 1
        WHEN 'staff' THEN 2
        WHEN 'student' THEN 3
      END,
      u.id ASC
  `).all();

  res.json({ accounts });
});

// POST /api/auth/register (Student self-registration)
router.post('/register', (req, res) => {
  const { full_name, email, password, student_id } = req.body;
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const hash = hashPassword(password);
  const info = db.prepare(`
    INSERT INTO users (full_name, email, password_hash, role, student_or_employee_id)
    VALUES (?, ?, ?, 'student', ?)
  `).run(full_name.trim(), email.trim().toLowerCase(), hash, student_id || null);

  const newUser = db.prepare('SELECT id, full_name, email, role, student_or_employee_id, is_active FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = generateToken(newUser);

  res.status(201).json({ token, user: newUser });
});

module.exports = router;
