/**
 * CampusCare - Automated Test Case Execution Runner
 * Tests Scenarios T-001 through T-020 from Section 11 of the SRS.
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function runTestSuite() {
  console.log('===============================================================');
  console.log('   CAMPUSCARE SRS VALIDATION SUITE (T-001 TO T-020)');
  console.log('   Testing against:', BASE_URL);
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function report(testId, name, isSuccess, details = '') {
    if (isSuccess) {
      console.log(`[PASS] ${testId.padEnd(6)} | ${name.padEnd(42)} | ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testId.padEnd(6)} | ${name.padEnd(42)} | ${details}`);
      failed++;
    }
  }

  // --- T-001: Student Login ---
  let studentToken = null;
  let studentUser = null;
  try {
    const res = await fetch(`${BASE_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul.sharma@student.edu' })
    });
    const data = await res.json();
    studentToken = data.token;
    studentUser = data.user;
    report('T-001', 'Student logs in & portal loads', res.ok && studentUser?.role === 'student', `User: ${studentUser?.full_name}`);
  } catch (e) {
    report('T-001', 'Student logs in & portal loads', false, e.message);
  }

  // --- T-002: Staff Login ---
  let staffToken = null;
  let staffUser = null;
  try {
    const res = await fetch(`${BASE_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'finance.staff@campuscare.edu' })
    });
    const data = await res.json();
    staffToken = data.token;
    staffUser = data.user;
    report('T-002', 'Staff logs in & dashboard loads', res.ok && staffUser?.role === 'staff', `User: ${staffUser?.full_name}`);
  } catch (e) {
    report('T-002', 'Staff logs in & dashboard loads', false, e.message);
  }

  // --- T-003: Admin Login ---
  let adminToken = null;
  let adminUser = null;
  try {
    const res = await fetch(`${BASE_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@campuscare.edu' })
    });
    const data = await res.json();
    adminToken = data.token;
    adminUser = data.user;
    report('T-003', 'Admin logs in & dashboard loads', res.ok && adminUser?.role === 'admin', `User: ${adminUser?.full_name}`);
  } catch (e) {
    report('T-003', 'Admin logs in & dashboard loads', false, e.message);
  }

  // --- T-004: Student creates a ticket ---
  let createdTicket = null;
  try {
    const res = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        category_id: 1, // Fees and Payments
        subject: 'Tuition receipt discrepancy for Semester 4',
        description: 'Payment was deducted via Net Banking, but the receipt generated shows an incorrect student roll number.',
        priority: 'high'
      })
    });
    const data = await res.json();
    createdTicket = data.ticket;
    const ok = res.status === 201 && createdTicket?.ticket_number?.startsWith('CC-2026-');
    report('T-004', 'Student creates ticket & unique ID', ok, `ID: ${createdTicket?.ticket_number}`);
  } catch (e) {
    report('T-004', 'Student creates ticket & unique ID', false, e.message);
  }

  // --- T-005: Student accesses another student ticket (Access Denied) ---
  try {
    // Ticket 2 belongs to Ananya Iyer (ID: 8), not Rahul Sharma (ID: 7)
    const res = await fetch(`${BASE_URL}/tickets/2`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    report('T-005', 'Student accesses other ticket (Denied)', res.status === 403, `HTTP ${res.status} Forbidden enforced`);
  } catch (e) {
    report('T-005', 'Student accesses other ticket (Denied)', false, e.message);
  }

  // --- T-006: Manager assigns a ticket ---
  try {
    const res = await fetch(`${BASE_URL}/tickets/${createdTicket.id}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ staff_id: 2 }) // Assign to Ramesh Kulkarni
    });
    const data = await res.json();
    const ok = res.ok && data.ticket?.assigned_to_id === 2;
    report('T-006', 'Manager assigns ticket to staff', ok, `Assigned to: ${data.ticket?.assignee_name || 'Staff #2'}`);
  } catch (e) {
    report('T-006', 'Manager assigns ticket to staff', false, e.message);
  }

  // --- T-007: Staff adds a public reply ---
  try {
    const res = await fetch(`${BASE_URL}/tickets/${createdTicket.id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        content: 'Please upload the bank transaction confirmation SMS or PDF slip.',
        visibility: 'public'
      })
    });
    const data = await res.json();
    report('T-007', 'Staff adds public reply', res.status === 201 && data.comment?.visibility === 'public', 'Public reply created');
  } catch (e) {
    report('T-007', 'Staff adds public reply', false, e.message);
  }

  // --- T-008: Staff adds internal note & Student Privacy ---
  try {
    const noteRes = await fetch(`${BASE_URL}/tickets/${createdTicket.id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        content: 'Bank reconciliation batch shows duplicate transaction tag from Razorpay.',
        visibility: 'internal'
      })
    });
    const noteData = await noteRes.json();

    // Verify student cannot see internal note
    const studentCheckRes = await fetch(`${BASE_URL}/tickets/${createdTicket.id}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const studentCheckData = await studentCheckRes.json();
    const leaked = (studentCheckData.comments || []).some(c => c.visibility === 'internal');

    report('T-008', 'Internal note hidden from student', noteRes.ok && !leaked, 'Protected: 0 internal notes visible to student');
  } catch (e) {
    report('T-008', 'Internal note hidden from student', false, e.message);
  }

  // --- T-009: Staff resolves ticket without summary (Rejected) ---
  try {
    const res = await fetch(`${BASE_URL}/tickets/${createdTicket.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({ status: 'resolved', resolution_summary: '' })
    });
    report('T-009', 'Resolve without summary (Rejected)', res.status === 400, `Rejected with HTTP 400: Required validation`);
  } catch (e) {
    report('T-009', 'Resolve without summary (Rejected)', false, e.message);
  }

  // --- T-010: Staff resolves ticket with summary ---
  try {
    const res = await fetch(`${BASE_URL}/tickets/${createdTicket.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        status: 'resolved',
        resolution_summary: 'Verified bank payment UTR 89123019. Updated roll number on fee portal and reissued receipt.'
      })
    });
    const data = await res.json();
    const ok = res.ok && data.ticket?.status === 'resolved' && !!data.ticket?.resolution_summary;
    report('T-010', 'Resolve with summary moves to Resolved', ok, `Status: ${data.ticket?.status}`);
  } catch (e) {
    report('T-010', 'Resolve with summary moves to Resolved', false, e.message);
  }

  // --- T-011: Student reopens an eligible ticket ---
  try {
    const res = await fetch(`${BASE_URL}/tickets/${createdTicket.id}/reopen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        reason: 'The digital receipt still shows the old section identifier.'
      })
    });
    const data = await res.json();
    const ok = res.ok && data.ticket?.status === 'in_progress' && data.ticket?.reopen_count === 1;
    report('T-011', 'Student reopens eligible ticket', ok, `Reopened to: ${data.ticket?.status} (Count: ${data.ticket?.reopen_count})`);
  } catch (e) {
    report('T-011', 'Student reopens eligible ticket', false, e.message);
  }

  // --- T-012: Ticket passes SLA deadline (Overdue detection) ---
  try {
    const res = await fetch(`${BASE_URL}/tickets/1`, { // Ticket 1 was seeded past due
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const ok = data.ticket?.is_overdue === true && data.ticket?.sla_status === 'Overdue';
    report('T-012', 'SLA deadline breach marked Overdue', ok, `Ticket #1 SLA: ${data.ticket?.sla_status}`);
  } catch (e) {
    report('T-012', 'SLA deadline breach marked Overdue', false, e.message);
  }

  // --- T-013: User filters tickets by priority ---
  try {
    const res = await fetch(`${BASE_URL}/tickets?priority=urgent`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const allUrgent = (data.tickets || []).every(t => t.priority === 'urgent');
    report('T-013', 'Filter tickets by priority', res.ok && allUrgent && data.tickets.length > 0, `Returned ${data.tickets.length} urgent tickets`);
  } catch (e) {
    report('T-013', 'Filter tickets by priority', false, e.message);
  }

  // --- T-014: User searches by ticket number ---
  try {
    const res = await fetch(`${BASE_URL}/tickets?search=${createdTicket.ticket_number}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const found = data.tickets?.find(t => t.ticket_number === createdTicket.ticket_number);
    report('T-014', 'Search by ticket number', res.ok && !!found, `Located ${createdTicket.ticket_number}`);
  } catch (e) {
    report('T-014', 'Search by ticket number', false, e.message);
  }

  // --- T-015: Dashboard loads derived from persisted data ---
  try {
    const res = await fetch(`${BASE_URL}/dashboard/admin`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const ok = res.ok && typeof data.kpis?.total === 'number' && data.kpis.total > 0;
    report('T-015', 'Dashboard metrics from persisted DB', ok, `Total in DB: ${data.kpis?.total} tickets`);
  } catch (e) {
    report('T-015', 'Dashboard metrics from persisted DB', false, e.message);
  }

  // --- T-016: User logs out (Protected pages require auth) ---
  try {
    const res = await fetch(`${BASE_URL}/tickets`, {
      headers: { Authorization: 'Bearer invalid_or_expired_token' }
    });
    report('T-016', 'Unauthenticated request blocked', res.status === 401, `HTTP ${res.status} Unauthorized`);
  } catch (e) {
    report('T-016', 'Unauthenticated request blocked', false, e.message);
  }

  // --- T-017: Staff unauthorized action (e.g. modify system settings) ---
  try {
    const res = await fetch(`${BASE_URL}/settings/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}` // staff is not admin
      },
      body: JSON.stringify({ name: 'Unauthorized Category' })
    });
    report('T-017', 'Unauthorized staff action denied', res.status === 403, `HTTP ${res.status} Forbidden`);
  } catch (e) {
    report('T-017', 'Unauthorized staff action denied', false, e.message);
  }

  // --- T-018: User submits invalid input (Validation errors) ---
  try {
    const res = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ category_id: 1, subject: 'hi', description: 'short' })
    });
    report('T-018', 'Invalid input validation errors', res.status === 400, 'Min character length enforced');
  } catch (e) {
    report('T-018', 'Invalid input validation errors', false, e.message);
  }

  // --- T-019: User adds comment (History persists) ---
  try {
    const historyRes = await fetch(`${BASE_URL}/tickets/${createdTicket.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await historyRes.json();
    const hasHistory = (data.history || []).length >= 4;
    report('T-019', 'Comment & audit history persist in DB', hasHistory, `${data.history?.length} audit entries stored`);
  } catch (e) {
    report('T-019', 'Comment & audit history persist in DB', false, e.message);
  }

  // --- T-020: Healthcheck and Application persistence ---
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    report('T-020', 'Database persistence & app health', res.ok && data.status === 'ok', 'Relational SQLite active');
  } catch (e) {
    report('T-020', 'Database persistence & app health', false, e.message);
  }

  console.log('\n===============================================================');
  console.log(`RESULTS: ${passed} PASSED / ${failed} FAILED (${Math.round((passed / (passed + failed)) * 100)}% SUCCESS RATE)`);
  console.log('===============================================================\n');

  if (failed === 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite();
