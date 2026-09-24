const db = require('./db');
const { hashPassword } = require('./auth');

function runSeed() {
  console.log('--- Starting CampusCare Database Seeding ---');

  // Clear existing data in correct FK order
  const tables = [
    'notifications',
    'ticket_history',
    'ticket_comments',
    'tickets',
    'sla_policies',
    'ticket_categories',
    'users',
    'departments',
  ];

  for (const table of tables) {
    db.prepare(`DELETE FROM ${table}`).run();
  }
  db.prepare(`DELETE FROM sqlite_sequence`).run();

  // 1. Seed Departments
  const insertDept = db.prepare('INSERT INTO departments (id, name, description) VALUES (?, ?, ?)');
  insertDept.run(1, 'Accounts & Finance', 'Handles fee payments, scholarship disbursements, and refunds');
  insertDept.run(2, 'Academic Affairs', 'Manages attendance, grade disputes, course registrations, and certificates');
  insertDept.run(3, 'Student Services & Registry', 'Oversees ID cards, hostel allocations, bonafide letters, and records');
  insertDept.run(4, 'IT Support', 'Provides assistance with college portal, campus Wi-Fi, LMS, and lab access');
  insertDept.run(5, 'General Administration', 'Campus facilities, transport, library, and general grievances');

  // 2. Seed Ticket Categories
  const insertCategory = db.prepare('INSERT INTO ticket_categories (id, name, description, department_id) VALUES (?, ?, ?, ?)');
  insertCategory.run(1, 'Fees and Payments', 'Tuition installments, payment receipt discrepancies, refund requests', 1);
  insertCategory.run(2, 'Attendance', 'Attendance shortage appeals, medical leave approval, biometric issues', 2);
  insertCategory.run(3, 'ID Cards', 'Lost student card replacement, smart chip issues, new card requests', 3);
  insertCategory.run(4, 'Documents and Certificates', 'Bonafide certificates, transfer certificates, transcripts, mark sheets', 2);
  insertCategory.run(5, 'Technical Support', 'Portal login lockouts, ERP errors, campus Wi-Fi credentials', 4);
  insertCategory.run(6, 'General Administration', 'Hostel maintenance, cafeteria feedback, library membership', 5);

  // 3. Seed SLA Policies
  const insertSla = db.prepare('INSERT INTO sla_policies (priority, first_response_minutes, resolution_minutes, pause_while_waiting) VALUES (?, ?, ?, ?)');
  insertSla.run('urgent', 30, 240, 1);    // 30 mins resp, 4 hrs res
  insertSla.run('high', 120, 1440, 1);     // 2 hrs resp, 24 hrs res
  insertSla.run('medium', 480, 2880, 1);   // 8 hrs resp, 48 hrs (2 days) res
  insertSla.run('low', 1440, 4320, 1);     // 24 hrs resp, 72 hrs (3 days) res

  // 4. Seed Users
  // Password for all demo accounts: Password@123
  const defaultPasswordHash = hashPassword('Password@123');

  const insertUser = db.prepare(`
    INSERT INTO users (id, full_name, email, password_hash, role, department_id, student_or_employee_id, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);

  // Admin
  insertUser.run(1, 'Dr. Aris Thorne (Registrar)', 'admin@campuscare.edu', defaultPasswordHash, 'admin', null, 'ADM-001');

  // Staff (4 across departments)
  insertUser.run(2, 'Prof. Ramesh Kulkarni', 'finance.staff@campuscare.edu', defaultPasswordHash, 'staff', 1, 'STF-101'); // Accounts
  insertUser.run(3, 'Dr. Sunita Deshmukh', 'academics.staff@campuscare.edu', defaultPasswordHash, 'staff', 2, 'STF-102'); // Academic
  insertUser.run(4, 'Mark Fernandes', 'registry.staff@campuscare.edu', defaultPasswordHash, 'staff', 3, 'STF-103'); // Registry
  insertUser.run(5, 'Kavita Menon', 'it.staff@campuscare.edu', defaultPasswordHash, 'staff', 4, 'STF-104'); // IT Support
  insertUser.run(6, 'Suresh Pillai', 'admin.staff@campuscare.edu', defaultPasswordHash, 'staff', 5, 'STF-105'); // General Admin

  // Students (10 students)
  const students = [
    { id: 7, name: 'Rahul Sharma', email: 'rahul.sharma@student.edu', roll: '2023-CS-042' },
    { id: 8, name: 'Ananya Iyer', email: 'ananya.iyer@student.edu', roll: '2023-EC-015' },
    { id: 9, name: 'Vikram Patel', email: 'vikram.patel@student.edu', roll: '2022-ME-088' },
    { id: 10, name: 'Sneha Reddy', email: 'sneha.reddy@student.edu', roll: '2024-BT-009' },
    { id: 11, name: 'Rohan Verma', email: 'rohan.verma@student.edu', roll: '2023-CS-112' },
    { id: 12, name: 'Pooja Nair', email: 'pooja.nair@student.edu', roll: '2022-CV-034' },
    { id: 13, name: 'Amit Kumar', email: 'amit.kumar@student.edu', roll: '2024-CS-004' },
    { id: 14, name: 'Priya Singh', email: 'priya.singh@student.edu', roll: '2023-EE-071' },
    { id: 15, name: 'Arjun Das', email: 'arjun.das@student.edu', roll: '2022-IT-023' },
    { id: 16, name: 'Meera Joshi', email: 'meera.joshi@student.edu', roll: '2024-EC-056' },
  ];

  for (const s of students) {
    insertUser.run(s.id, s.name, s.email, defaultPasswordHash, 'student', null, s.roll);
  }

  // 5. Seed 32 Realistic Tickets
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;

  const insertTicket = db.prepare(`
    INSERT INTO tickets (
      id, ticket_number, requester_id, assigned_to_id, department_id, category_id,
      subject, description, priority, status, resolution_summary, next_action_owner,
      first_response_due_at, first_responded_at, resolution_due_at, resolved_at,
      closed_at, reopen_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertComment = db.prepare(`
    INSERT INTO ticket_comments (ticket_id, author_id, content, visibility, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertHistory = db.prepare(`
    INSERT INTO ticket_history (ticket_id, actor_id, action_type, old_value, new_value, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNotification = db.prepare(`
    INSERT INTO notifications (user_id, ticket_id, type, message, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Sample seed tickets dataset
  const ticketDefs = [
    // 1. Urgent Overdue (IT - Wi-Fi exam emergency)
    {
      id: 1, num: 'CC-2026-00101', req: 7, staff: 5, dept: 4, cat: 5,
      subject: 'Lab Wi-Fi connection failing during semester online exam',
      desc: 'System in Lab 4 room 203 cannot authenticate with institutional credentials. Online exam starts in 20 minutes.',
      prio: 'urgent', stat: 'open', next: 'staff',
      ageDays: 0.3, respDueMins: 30, resDueMins: 240, overdue: true,
      comments: [
        { author: 7, vis: 'public', text: 'Please resolve urgently, exam supervisor is waiting.' }
      ]
    },
    // 2. Urgent In-Progress (Accounts - Fee payment failure duplicate deduction)
    {
      id: 2, num: 'CC-2026-00102', req: 8, staff: 2, dept: 1, cat: 1,
      subject: 'Semester 4 tuition deducted twice from bank account',
      desc: 'Payment gateway showed timeout, so re-attempted. Now 48,000 INR deducted twice. Reference ID TXN994821.',
      prio: 'urgent', stat: 'in_progress', next: 'staff',
      ageDays: 1, respDueMins: 30, resDueMins: 240, overdue: true, responded: true,
      comments: [
        { author: 2, vis: 'public', text: 'We have received your transaction logs. Contacting the gateway merchant for reversal.' },
        { author: 2, vis: 'internal', text: 'Merchant portal confirms duplicate charge batch #4401. Reversal initiated.' }
      ]
    },
    // 3. High - Overdue (Academics - Attendance shortage grievance)
    {
      id: 3, num: 'CC-2026-00103', req: 9, staff: 3, dept: 2, cat: 2,
      subject: 'Hospitalization medical certificate not reflected in attendance',
      desc: 'Submitted medical certificate for typhoid hospitalization (12th to 20th Feb) to HOD office, but portal still shows 68% attendance.',
      prio: 'high', stat: 'in_progress', next: 'staff',
      ageDays: 4, respDueMins: 120, resDueMins: 1440, overdue: true, responded: true,
      comments: [
        { author: 3, vis: 'public', text: 'We are validating the medical fitness certificate with the campus medical officer.' },
        { author: 3, vis: 'internal', text: 'Doctor approved the certificate on 22nd. Pending Dean signature.' }
      ]
    },
    // 4. High - Approaching Deadline (Registry - Lost ID Card)
    {
      id: 4, num: 'CC-2026-00104', req: 10, staff: 4, dept: 3, cat: 3,
      subject: 'Duplicate Smart ID Card needed for campus gate entry',
      desc: 'Lost wallet with ID card yesterday on route 4 bus. Police non-traceable acknowledgement uploaded.',
      prio: 'high', stat: 'in_progress', next: 'staff',
      ageDays: 0.5, respDueMins: 120, resDueMins: 1440, approaching: true, responded: true,
      comments: [
        { author: 4, vis: 'public', text: 'Please pay the duplicate card fee of Rs. 200 at counter 3 or through portal.' }
      ]
    },
    // 5. Medium - Waiting for Student (Registry - Degree transcript)
    {
      id: 5, num: 'CC-2026-00105', req: 11, staff: 4, dept: 3, cat: 4,
      subject: 'Request for official sealed transcripts for German university application',
      desc: 'Need 3 copies of official transcript with registrar seal for DAAD scholarship application deadline.',
      prio: 'medium', stat: 'waiting_for_student', next: 'student',
      ageDays: 3, respDueMins: 480, resDueMins: 2880, responded: true,
      comments: [
        { author: 4, vis: 'public', text: 'Please provide the exact postal address and recipient faculty name for international dispatch.' }
      ]
    },
    // 6. Medium - Resolved (Accounts - Scholarship stipend adjustment)
    {
      id: 6, num: 'CC-2026-00106', req: 12, staff: 2, dept: 1, cat: 1,
      subject: 'Merit-cum-means scholarship credit adjustment',
      desc: 'Sanction letter received from State Directorate but scholarship deduction not reflected on fee portal.',
      prio: 'medium', stat: 'resolved', next: 'student',
      ageDays: 5, respDueMins: 480, resDueMins: 2880, responded: true, resolved: true,
      resolutionSummary: 'Verified sanction order #SCH-2026-981. Credit voucher of INR 25,000 applied to current semester balance.',
      comments: [
        { author: 2, vis: 'public', text: 'The scholarship adjustment voucher has been posted to your ledger.' }
      ]
    },
    // 7. Low - Closed (General Admin - Library membership renewal)
    {
      id: 7, num: 'CC-2026-00107', req: 13, staff: 6, dept: 5, cat: 6,
      subject: 'Digital library remote VPN access renewal',
      desc: 'Remote access credentials for IEEE and Springer digital library expired on 28th Feb.',
      prio: 'low', stat: 'closed', next: 'student',
      ageDays: 9, respDueMins: 1440, resDueMins: 4320, responded: true, resolved: true, closed: true,
      resolutionSummary: 'Renewed LDAP credentials and verified remote proxy access to IEEE Xplore.',
      comments: [
        { author: 6, vis: 'public', text: 'Credentials updated. You can login with your campus email.' }
      ]
    },
    // 8. Low - Open Unassigned (General Admin - Cafeteria card recharge)
    {
      id: 8, num: 'CC-2026-00108', req: 14, staff: null, dept: 5, cat: 6,
      subject: 'Cafeteria smart balance not updated after UPI payment',
      desc: 'Paid INR 1500 via GPay at central mess kiosk. Balance still shows zero.',
      prio: 'low', stat: 'open', next: 'manager',
      ageDays: 0.2, respDueMins: 1440, resDueMins: 4320,
      comments: []
    },
    // 9. Medium - Open Unassigned (IT - Hostel Wi-Fi router reboot)
    {
      id: 9, num: 'CC-2026-00109', req: 15, staff: null, dept: 4, cat: 5,
      subject: 'Hostel Block C 3rd floor Wi-Fi access point offline',
      desc: 'No SSID broadcasting since 8 AM today in rooms 301 to 318.',
      prio: 'medium', stat: 'open', next: 'manager',
      ageDays: 0.4, respDueMins: 480, resDueMins: 2880,
      comments: []
    },
    // 10. Urgent - In Progress (Academics - Hall ticket withholding error)
    {
      id: 10, num: 'CC-2026-00110', req: 16, staff: 3, dept: 2, cat: 2,
      subject: 'Hall ticket download blocked due to incorrect fee dues flag',
      desc: 'Portal shows fee pending flag, but all dues were cleared on Jan 15th. Exam is tomorrow at 9 AM.',
      prio: 'urgent', stat: 'in_progress', next: 'staff',
      ageDays: 0.1, respDueMins: 30, resDueMins: 240, responded: true,
      comments: [
        { author: 3, vis: 'public', text: 'Flag cleared manually in examination database. Please re-download hall ticket.' }
      ]
    },
    // 11 to 32: Mix of tickets covering ages, statuses, categories, priorities
    {
      id: 11, num: 'CC-2026-00111', req: 7, staff: 2, dept: 1, cat: 1,
      subject: 'Hostel fee security deposit refund on semester withdrawal',
      desc: 'Vacated hostel on Feb 1st, clearance form signed by warden. Security refund pending.',
      prio: 'medium', stat: 'in_progress', next: 'staff',
      ageDays: 6, respDueMins: 480, resDueMins: 2880, overdue: true, responded: true,
      comments: [{ author: 2, vis: 'internal', text: 'Awaiting finance officer approval batch 12.' }]
    },
    {
      id: 12, num: 'CC-2026-00112', req: 8, staff: 4, dept: 3, cat: 3,
      subject: 'Typo in student name on ID card chip data',
      desc: 'Name printed as Ananya Iyre instead of Ananya Iyer. Library scanner rejects the card.',
      prio: 'low', stat: 'resolved', next: 'student',
      ageDays: 8, respDueMins: 1440, resDueMins: 4320, responded: true, resolved: true,
      resolutionSummary: 'Card re-encoded and reprinted. Available for collection at counter 2.',
      comments: [{ author: 4, vis: 'public', text: 'New card printed and ready.' }]
    },
    {
      id: 13, num: 'CC-2026-00113', req: 9, staff: 5, dept: 4, cat: 5,
      subject: 'Cannot login to Turnitin plagiarism software for M.Tech dissertation',
      desc: 'Activation email expired before link was clicked. Need reset link.',
      prio: 'high', stat: 'open', next: 'staff',
      ageDays: 1.5, respDueMins: 120, resDueMins: 1440, overdue: true,
      comments: []
    },
    {
      id: 14, num: 'CC-2026-00114', req: 10, staff: 3, dept: 2, cat: 4,
      subject: 'Bonafide certificate for passport renewal application',
      desc: 'Passport seva kendra requires original stamped bonafide certificate with photo attestation.',
      prio: 'medium', stat: 'resolved', next: 'student',
      ageDays: 2.5, respDueMins: 480, resDueMins: 2880, responded: true, resolved: true,
      resolutionSummary: 'Certificate generated, signed by Dean Academics, and dispatched via registry.',
      comments: [{ author: 3, vis: 'public', text: 'Certificate ready at academic counter.' }]
    },
    {
      id: 15, num: 'CC-2026-00115', req: 11, staff: 2, dept: 1, cat: 1,
      subject: 'Education loan disbursement documentation confirmation',
      desc: 'SBI branch needs formal demand notice breakdown for semester 5 tuition and mess.',
      prio: 'medium', stat: 'waiting_for_student', next: 'student',
      ageDays: 2, respDueMins: 480, resDueMins: 2880, responded: true,
      comments: [{ author: 2, vis: 'public', text: 'Please upload the branch manager loan sanction letter.' }]
    },
    {
      id: 16, num: 'CC-2026-00116', req: 12, staff: 3, dept: 2, cat: 2,
      subject: 'Attendance correction for Sports Meet participation',
      desc: 'Represented college at Inter-University Basketball tournament Feb 10-15. Physical director letter attached.',
      prio: 'low', stat: 'in_progress', next: 'staff',
      ageDays: 4.5, respDueMins: 1440, resDueMins: 4320, overdue: true, responded: true,
      comments: [{ author: 3, vis: 'internal', text: 'Confirmed with PE Department. Updating attendance records.' }]
    },
    {
      id: 17, num: 'CC-2026-00117', req: 13, staff: 5, dept: 4, cat: 5,
      subject: 'Matlab network license server connection error in CAD Lab',
      desc: 'License manager error -15: Cannot connect to license server system on port 27000.',
      prio: 'high', stat: 'resolved', next: 'student',
      ageDays: 3, respDueMins: 120, resDueMins: 1440, responded: true, resolved: true,
      resolutionSummary: 'Restarted FlexLM license service and opened firewall port 27000 on subnet 10.4.0.0/16.',
      comments: [{ author: 5, vis: 'public', text: 'License daemon rebooted. All 50 seats operational.' }]
    },
    {
      id: 18, num: 'CC-2026-00118', req: 14, staff: 6, dept: 5, cat: 6,
      subject: 'Hostel mess food quality grievance and cleanliness',
      desc: 'Repeated cold food served during dinner in Girls Hostel 2. Hygiene audit requested.',
      prio: 'medium', stat: 'in_progress', next: 'staff',
      ageDays: 1.2, respDueMins: 480, resDueMins: 2880, responded: true,
      comments: [{ author: 6, vis: 'public', text: 'Mess committee inspected the kitchen today. Action notice issued to vendor.' }]
    },
    {
      id: 19, num: 'CC-2026-00119', req: 15, staff: 4, dept: 3, cat: 3,
      subject: 'Damaged barcode on ID card prevents book issue at Central Library',
      desc: 'Lamination peeling off barcode strip. Library barcode scanner cannot read.',
      prio: 'low', stat: 'closed', next: 'student',
      ageDays: 14, respDueMins: 1440, resDueMins: 4320, responded: true, resolved: true, closed: true,
      resolutionSummary: 'Free re-lamination done at registry counter.',
      comments: [{ author: 4, vis: 'public', text: 'Replaced barcode strip.' }]
    },
    {
      id: 20, num: 'CC-2026-00120', req: 16, staff: 2, dept: 1, cat: 1,
      subject: 'Tuition installment plan request due to family medical emergency',
      desc: 'Requesting permission to pay remaining 50% tuition in two installments in April and May.',
      prio: 'high', stat: 'in_progress', next: 'staff',
      ageDays: 0.8, respDueMins: 120, resDueMins: 1440, approaching: true, responded: true,
      comments: [{ author: 2, vis: 'internal', text: 'Forwarded to Finance Director for special installment approval.' }]
    },
    {
      id: 21, num: 'CC-2026-00121', req: 7, staff: null, dept: 3, cat: 4,
      subject: 'Migration certificate required for foreign internship registration',
      desc: 'Need university migration clearance for MITACS Globalink research internship.',
      prio: 'medium', stat: 'open', next: 'manager',
      ageDays: 0.6, respDueMins: 480, resDueMins: 2880,
      comments: []
    },
    {
      id: 22, num: 'CC-2026-00122', req: 8, staff: 3, dept: 2, cat: 2,
      subject: 'Clash between elective subjects in final exam timetable',
      desc: 'Machine Learning (CS401) and Cloud Computing (CS409) scheduled at the same time on March 28th 2 PM.',
      prio: 'urgent', stat: 'resolved', next: 'student',
      ageDays: 2, respDueMins: 30, resDueMins: 240, responded: true, resolved: true,
      resolutionSummary: 'Examination controller revised schedule. CS409 moved to March 29th morning slot.',
      comments: [{ author: 3, vis: 'public', text: 'Schedule revision published on academic notice board.' }]
    },
    {
      id: 23, num: 'CC-2026-00123', req: 9, staff: 5, dept: 4, cat: 5,
      subject: 'Campus email inbox quota exceeded - not receiving placement emails',
      desc: 'Campus mailbox @student.edu bounced company invite because storage is full (5GB limit).',
      prio: 'urgent', stat: 'in_progress', next: 'staff',
      ageDays: 0.2, respDueMins: 30, resDueMins: 240, approaching: true, responded: true,
      comments: [{ author: 5, vis: 'public', text: 'Allocated emergency temporary 5GB quota boost. Please archive old attachments.' }]
    },
    {
      id: 24, num: 'CC-2026-00124', req: 10, staff: null, dept: 5, cat: 6,
      subject: 'Campus shuttle bus route 3 timings irregularity in morning',
      desc: 'Morning 8:15 AM bus from Metro station consistently arriving 30 minutes late, causing students to miss first period.',
      prio: 'low', stat: 'open', next: 'manager',
      ageDays: 3.2, respDueMins: 1440, resDueMins: 4320, overdue: true,
      comments: []
    },
    {
      id: 25, num: 'CC-2026-00125', req: 11, staff: 4, dept: 3, cat: 4,
      subject: 'Medium of instruction English proficiency certificate for IELTS waiver',
      desc: 'Applying for Masters abroad, university requires formal letter stating undergraduate coursework was taught in English.',
      prio: 'medium', stat: 'resolved', next: 'student',
      ageDays: 5, respDueMins: 480, resDueMins: 2880, responded: true, resolved: true,
      resolutionSummary: 'Issued official English Medium of Instruction letter stamped by Registrar.',
      comments: [{ author: 4, vis: 'public', text: 'Digital PDF signed copy attached. Hardcopy ready.' }]
    },
    {
      id: 26, num: 'CC-2026-00126', req: 12, staff: 2, dept: 1, cat: 1,
      subject: 'Tax exemption certificate (Section 80E) for father education loan',
      desc: 'Need 80E interest and tuition fee break-up certificate for income tax return filing.',
      prio: 'low', stat: 'waiting_for_student', next: 'student',
      ageDays: 4, respDueMins: 1440, resDueMins: 4320, responded: true,
      comments: [{ author: 2, vis: 'public', text: 'Please specify the exact financial year required (2024-25 or 2025-26).' }]
    },
    {
      id: 27, num: 'CC-2026-00127', req: 13, staff: 3, dept: 2, cat: 2,
      subject: 'Re-evaluation score update missing on web transcript',
      desc: 'Re-evaluation result of Engineering Mathematics III improved grade from C to A, but portal still lists C.',
      prio: 'high', stat: 'in_progress', next: 'staff',
      ageDays: 1.8, respDueMins: 120, resDueMins: 1440, overdue: true, responded: true,
      comments: [{ author: 3, vis: 'internal', text: 'Evaluation cell marksheet sync script pending execution.' }]
    },
    {
      id: 28, num: 'CC-2026-00128', req: 14, staff: 6, dept: 5, cat: 6,
      subject: 'Gymnasium equipment broken in sports complex',
      desc: 'Cable snapped on leg press machine in student fitness center. Safety hazard.',
      prio: 'medium', stat: 'resolved', next: 'student',
      ageDays: 7, respDueMins: 480, resDueMins: 2880, responded: true, resolved: true,
      resolutionSummary: 'Equipment technician repaired the cable tension pulley and certified machine safe for use.',
      comments: [{ author: 6, vis: 'public', text: 'Repaired and inspected.' }]
    },
    {
      id: 29, num: 'CC-2026-00129', req: 15, staff: 5, dept: 4, cat: 5,
      subject: 'Gitlab server SSH key authentication rejected in software lab',
      desc: 'Git push to internal institutional GitLab fails with Permission Denied (publickey).',
      prio: 'medium', stat: 'closed', next: 'student',
      ageDays: 11, respDueMins: 480, resDueMins: 2880, responded: true, resolved: true, closed: true,
      resolutionSummary: 'User public key had trailing carriage returns. Re-uploaded clean Ed25519 key.',
      comments: [{ author: 5, vis: 'public', text: 'SSH test passed.' }]
    },
    {
      id: 30, num: 'CC-2026-00130', req: 16, staff: 4, dept: 3, cat: 3,
      subject: 'Bus pass smart card authorization error on route 7',
      desc: 'Bus conductor scanner beeps red stating card expired, though annual pass was renewed in January.',
      prio: 'medium', stat: 'in_progress', next: 'staff',
      ageDays: 1.1, respDueMins: 480, resDueMins: 2880, responded: true,
      comments: [{ author: 4, vis: 'public', text: 'Updating route 7 bus validator database sync.' }]
    },
    {
      id: 31, num: 'CC-2026-00131', req: 7, staff: 2, dept: 1, cat: 1,
      subject: 'Late fee fine waiver appeal due to bank server downtime',
      desc: 'Bank gateway was down on the last day of regular fee payment. Penalty of INR 1000 charged.',
      prio: 'low', stat: 'open', next: 'staff',
      ageDays: 0.1, respDueMins: 1440, resDueMins: 4320,
      comments: []
    },
    {
      id: 32, num: 'CC-2026-00132', req: 8, staff: 3, dept: 2, cat: 4,
      subject: 'Provisional degree certificate for job joining verification',
      desc: 'Accepted offer letter from TCS starting next month. HR requires provisional degree certificate.',
      prio: 'high', stat: 'waiting_for_student', next: 'student',
      ageDays: 1.5, respDueMins: 120, resDueMins: 1440, overdue: true, responded: true,
      comments: [{ author: 3, vis: 'public', text: 'Please submit no-dues certificate from library and hostel first.' }]
    }
  ];

  for (const t of ticketDefs) {
    const createdAt = new Date(now - t.ageDays * ONE_DAY).toISOString();
    const updatedAt = new Date(now - (t.ageDays * 0.3) * ONE_DAY).toISOString();

    const createdTime = new Date(createdAt).getTime();

    // SLA calculations
    let firstRespDue;
    let resDue;
    let firstRespAt = null;

    if (t.overdue && !t.resolved) {
      // Overdue: due dates in the past
      firstRespDue = new Date(createdTime + t.respDueMins * 60 * 1000).toISOString();
      resDue = new Date(createdTime + t.resDueMins * 60 * 1000).toISOString();
      if (t.responded) {
        firstRespAt = new Date(createdTime + (t.respDueMins * 1.5) * 60 * 1000).toISOString();
      }
    } else if (t.approaching) {
      // Approaching deadline: resolution due in next 45 minutes
      firstRespDue = new Date(now - 10 * 60 * 1000).toISOString();
      firstRespAt = new Date(now - 15 * 60 * 1000).toISOString();
      resDue = new Date(now + 45 * 60 * 1000).toISOString();
    } else {
      // Normal
      firstRespDue = new Date(createdTime + t.respDueMins * 60 * 1000).toISOString();
      resDue = new Date(createdTime + t.resDueMins * 60 * 1000).toISOString();
      if (t.responded) {
        firstRespAt = new Date(createdTime + (t.respDueMins * 0.4) * 60 * 1000).toISOString();
      }
    }

    const resolvedAt = t.resolved ? new Date(createdTime + (t.resDueMins * 0.7) * 60 * 1000).toISOString() : null;
    const closedAt = t.closed ? new Date(createdTime + (t.resDueMins * 0.9) * 60 * 1000).toISOString() : null;

    insertTicket.run(
      t.id, t.num, t.req, t.staff, t.dept, t.cat,
      t.subject, t.desc, t.prio, t.stat, t.resolutionSummary || null, t.next,
      firstRespDue, firstRespAt, resDue, resolvedAt, closedAt,
      0, createdAt, updatedAt
    );

    // Initial creation history
    insertHistory.run(
      t.id, t.req, 'created', null, 'open',
      `Ticket submitted by student #${t.req}`,
      createdAt
    );

    // Assignment history
    if (t.staff) {
      insertHistory.run(
        t.id, 1, 'assigned', 'Unassigned', `Staff #${t.staff}`,
        `Ticket assigned to Staff #${t.staff}`,
        new Date(createdTime + 10 * 60 * 1000).toISOString()
      );
    }

    // Status transition history
    if (t.stat !== 'open') {
      insertHistory.run(
        t.id, t.staff || 1, 'status_change', 'open', t.stat,
        `Status transitioned to ${t.stat}`,
        updatedAt
      );
    }

    // Resolution history
    if (t.resolved) {
      insertHistory.run(
        t.id, t.staff, 'resolved', 'in_progress', 'resolved',
        `Ticket resolved: ${t.resolutionSummary}`,
        resolvedAt
      );
    }

    // Comments
    if (t.comments && t.comments.length > 0) {
      for (const c of t.comments) {
        const commentTime = new Date(createdTime + 20 * 60 * 1000).toISOString();
        insertComment.run(t.id, c.author, c.text, c.vis, commentTime, commentTime);
      }
    }
  }

  // 6. Seed Sample In-App Notifications
  insertNotification.run(7, 1, 'ticket_status', 'Your ticket CC-2026-00101 was received and queued for IT Support.', 0, new Date().toISOString());
  insertNotification.run(8, 2, 'comment_added', 'Staff Ramesh Kulkarni commented on your ticket CC-2026-00102.', 0, new Date().toISOString());
  insertNotification.run(11, 5, 'waiting_student', 'Staff requested additional info on ticket CC-2026-00105.', 0, new Date().toISOString());
  insertNotification.run(12, 6, 'ticket_resolved', 'Your ticket CC-2026-00106 has been resolved.', 1, new Date().toISOString());
  insertNotification.run(2, 2, 'ticket_assigned', 'High priority ticket CC-2026-00102 was assigned to you.', 0, new Date().toISOString());
  insertNotification.run(3, 3, 'sla_breach', 'Ticket CC-2026-00103 has breached the resolution deadline!', 0, new Date().toISOString());
  insertNotification.run(1, 1, 'overdue_escalation', '3 tickets require managerial intervention due to SLA breach.', 0, new Date().toISOString());

  console.log('--- Seeding Completed Successfully! ---');
  console.log('Seeded: 5 Departments, 6 Categories, 4 SLA Policies, 16 Users (1 Admin, 5 Staff, 10 Students), 32 Realistic Tickets with full history & comments.');
}

if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };
