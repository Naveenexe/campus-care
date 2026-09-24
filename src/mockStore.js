// Client-side Mock Store for CampusCare
// Enables 100% full-functionality interactive demos when deployed on static hosts like Netlify
// Mirrors SQLite database schemas and API operations in browser localStorage

const STORAGE_KEY = 'campuscare_offline_db_v1';

const INITIAL_DEPARTMENTS = [
  { id: 1, name: 'Accounts & Finance', description: 'Handles fee payments, scholarship disbursements, and refunds' },
  { id: 2, name: 'Academic Affairs', description: 'Manages attendance, grade disputes, course registrations, and certificates' },
  { id: 3, name: 'Student Services & Registry', description: 'Oversees ID cards, hostel allocations, bonafide letters, and records' },
  { id: 4, name: 'IT Support', description: 'Provides assistance with college portal, campus Wi-Fi, LMS, and lab access' },
  { id: 5, name: 'General Administration', description: 'Campus facilities, transport, library, and general grievances' },
];

const INITIAL_CATEGORIES = [
  { id: 1, name: 'Fees and Payments', description: 'Tuition installments, payment receipt discrepancies, refund requests', department_id: 1 },
  { id: 2, name: 'Attendance', description: 'Attendance shortage appeals, medical leave approval, biometric issues', department_id: 2 },
  { id: 3, name: 'ID Cards', description: 'Lost student card replacement, smart chip issues, new card requests', department_id: 3 },
  { id: 4, name: 'Documents and Certificates', description: 'Bonafide certificates, transfer certificates, transcripts, mark sheets', department_id: 2 },
  { id: 5, name: 'Technical Support', description: 'Portal login lockouts, ERP errors, campus Wi-Fi credentials', department_id: 4 },
  { id: 6, name: 'General Administration', description: 'Hostel maintenance, cafeteria feedback, library membership', department_id: 5 },
];

const INITIAL_SLA_POLICIES = [
  { priority: 'urgent', first_response_minutes: 30, resolution_minutes: 240, pause_while_waiting: 1 },
  { priority: 'high', first_response_minutes: 120, resolution_minutes: 1440, pause_while_waiting: 1 },
  { priority: 'medium', first_response_minutes: 480, resolution_minutes: 2880, pause_while_waiting: 1 },
  { priority: 'low', first_response_minutes: 1440, resolution_minutes: 4320, pause_while_waiting: 1 },
];

const INITIAL_USERS = [
  { id: 1, full_name: 'Dr. Aris Thorne (Registrar)', email: 'admin@campuscare.edu', role: 'admin', department_id: null, student_or_employee_id: 'ADM-001', is_active: 1 },
  { id: 2, full_name: 'Prof. Ramesh Kulkarni', email: 'finance.staff@campuscare.edu', role: 'staff', department_id: 1, student_or_employee_id: 'STF-101', is_active: 1 },
  { id: 3, full_name: 'Dr. Sunita Deshmukh', email: 'academics.staff@campuscare.edu', role: 'staff', department_id: 2, student_or_employee_id: 'STF-102', is_active: 1 },
  { id: 4, full_name: 'Mark Fernandes', email: 'registry.staff@campuscare.edu', role: 'staff', department_id: 3, student_or_employee_id: 'STF-103', is_active: 1 },
  { id: 5, full_name: 'Kavita Menon', email: 'it.staff@campuscare.edu', role: 'staff', department_id: 4, student_or_employee_id: 'STF-104', is_active: 1 },
  { id: 6, full_name: 'Suresh Pillai', email: 'admin.staff@campuscare.edu', role: 'staff', department_id: 5, student_or_employee_id: 'STF-105', is_active: 1 },
  { id: 7, full_name: 'Rahul Sharma', email: 'rahul.sharma@student.edu', role: 'student', department_id: null, student_or_employee_id: '2023-CS-042', is_active: 1 },
  { id: 8, full_name: 'Ananya Iyer', email: 'ananya.iyer@student.edu', role: 'student', department_id: null, student_or_employee_id: '2023-EC-015', is_active: 1 },
  { id: 9, full_name: 'Vikram Patel', email: 'vikram.patel@student.edu', role: 'student', department_id: null, student_or_employee_id: '2022-ME-088', is_active: 1 },
  { id: 10, full_name: 'Sneha Reddy', email: 'sneha.reddy@student.edu', role: 'student', department_id: null, student_or_employee_id: '2024-BT-009', is_active: 1 },
  { id: 11, full_name: 'Rohan Verma', email: 'rohan.verma@student.edu', role: 'student', department_id: null, student_or_employee_id: '2023-CS-112', is_active: 1 },
  { id: 12, full_name: 'Pooja Nair', email: 'pooja.nair@student.edu', role: 'student', department_id: null, student_or_employee_id: '2022-CV-034', is_active: 1 },
  { id: 13, full_name: 'Amit Kumar', email: 'amit.kumar@student.edu', role: 'student', department_id: null, student_or_employee_id: '2024-CS-004', is_active: 1 },
  { id: 14, full_name: 'Priya Singh', email: 'priya.singh@student.edu', role: 'student', department_id: null, student_or_employee_id: '2023-EE-071', is_active: 1 },
  { id: 15, full_name: 'Arjun Das', email: 'arjun.das@student.edu', role: 'student', department_id: null, student_or_employee_id: '2022-IT-023', is_active: 1 },
  { id: 16, full_name: 'Meera Joshi', email: 'meera.joshi@student.edu', role: 'student', department_id: null, student_or_employee_id: '2024-EC-056', is_active: 1 },
];

function generateSeedTickets() {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;

  const raw = [
    { id: 1, num: 'CC-2026-00101', req: 7, staff: 5, dept: 4, cat: 5, subject: 'Lab Wi-Fi connection failing during semester online exam', desc: 'System in Lab 4 room 203 cannot authenticate with institutional credentials. Online exam starts in 20 minutes.', prio: 'urgent', stat: 'open', next: 'staff', ageDays: 0.3, respDueMins: 30, resDueMins: 240, overdue: true, comments: [{ author: 7, vis: 'public', text: 'Please resolve urgently, exam supervisor is waiting.' }] },
    { id: 2, num: 'CC-2026-00102', req: 8, staff: 2, dept: 1, cat: 1, subject: 'Semester 4 tuition deducted twice from bank account', desc: 'Payment gateway showed timeout, so re-attempted. Now 48,000 INR deducted twice. Reference ID TXN994821.', prio: 'urgent', stat: 'in_progress', next: 'staff', ageDays: 1, respDueMins: 30, resDueMins: 240, overdue: true, responded: true, comments: [{ author: 2, vis: 'public', text: 'We have received your transaction logs. Contacting the gateway merchant for reversal.' }, { author: 2, vis: 'internal', text: 'Merchant portal confirms duplicate charge batch #4401. Reversal initiated.' }] },
    { id: 3, num: 'CC-2026-00103', req: 9, staff: 3, dept: 2, cat: 2, subject: 'Hospitalization medical certificate not reflected in attendance', desc: 'Submitted medical certificate for typhoid hospitalization (12th to 20th Feb) to HOD office, but portal still shows 68% attendance.', prio: 'high', stat: 'in_progress', next: 'staff', ageDays: 4, respDueMins: 120, resDueMins: 1440, overdue: true, responded: true, comments: [{ author: 3, vis: 'public', text: 'We are validating the medical fitness certificate with the campus medical officer.' }] },
    { id: 4, num: 'CC-2026-00104', req: 10, staff: 4, dept: 3, cat: 3, subject: 'Duplicate Smart ID Card needed for campus gate entry', desc: 'Lost wallet with ID card yesterday on route 4 bus. Police non-traceable acknowledgement uploaded.', prio: 'high', stat: 'in_progress', next: 'staff', ageDays: 0.5, respDueMins: 120, resDueMins: 1440, responded: true, comments: [{ author: 4, vis: 'public', text: 'Please pay the duplicate card fee of Rs. 200 at counter 3 or through portal.' }] },
    { id: 5, num: 'CC-2026-00105', req: 11, staff: 4, dept: 3, cat: 4, subject: 'Request for official sealed transcripts for German university application', desc: 'Need 3 copies of official transcript with registrar seal for DAAD scholarship application deadline.', prio: 'medium', stat: 'waiting_for_student', next: 'student', ageDays: 3, respDueMins: 480, resDueMins: 2880, responded: true, comments: [{ author: 4, vis: 'public', text: 'Please provide the exact postal address and recipient faculty name for international dispatch.' }] },
    { id: 6, num: 'CC-2026-00106', req: 12, staff: 2, dept: 1, cat: 1, subject: 'Merit-cum-means scholarship credit adjustment', desc: 'Sanction letter received from State Directorate but scholarship deduction not reflected on fee portal.', prio: 'medium', stat: 'resolved', next: 'student', ageDays: 5, respDueMins: 480, resDueMins: 2880, responded: true, resolved: true, resolutionSummary: 'Verified sanction order #SCH-2026-981. Credit voucher applied.', comments: [{ author: 2, vis: 'public', text: 'The scholarship adjustment voucher has been posted to your ledger.' }] },
    { id: 7, num: 'CC-2026-00107', req: 13, staff: 6, dept: 5, cat: 6, subject: 'Digital library remote VPN access renewal', desc: 'Remote access credentials for IEEE and Springer digital library expired on 28th Feb.', prio: 'low', stat: 'closed', next: 'student', ageDays: 9, respDueMins: 1440, resDueMins: 4320, responded: true, resolved: true, closed: true, resolutionSummary: 'Renewed LDAP credentials.', comments: [{ author: 6, vis: 'public', text: 'Credentials updated. You can login with your campus email.' }] },
    { id: 8, num: 'CC-2026-00108', req: 14, staff: null, dept: 5, cat: 6, subject: 'Cafeteria smart balance not updated after UPI payment', desc: 'Paid INR 1500 via GPay at central mess kiosk. Balance still shows zero.', prio: 'low', stat: 'open', next: 'manager', ageDays: 0.2, respDueMins: 1440, resDueMins: 4320, comments: [] },
    { id: 9, num: 'CC-2026-00109', req: 15, staff: null, dept: 4, cat: 5, subject: 'Hostel Block C 3rd floor Wi-Fi access point offline', desc: 'No SSID broadcasting since 8 AM today in rooms 301 to 318.', prio: 'medium', stat: 'open', next: 'manager', ageDays: 0.4, respDueMins: 480, resDueMins: 2880, comments: [] },
    { id: 10, num: 'CC-2026-00110', req: 16, staff: 3, dept: 2, cat: 2, subject: 'Hall ticket download blocked due to incorrect fee dues flag', desc: 'Portal shows fee pending flag, but all dues were cleared on Jan 15th. Exam is tomorrow at 9 AM.', prio: 'urgent', stat: 'in_progress', next: 'staff', ageDays: 0.1, respDueMins: 30, resDueMins: 240, responded: true, comments: [{ author: 3, vis: 'public', text: 'Flag cleared manually in examination database. Please re-download.' }] },
    { id: 11, num: 'CC-2026-00111', req: 7, staff: 2, dept: 1, cat: 1, subject: 'Hostel fee security deposit refund on semester withdrawal', desc: 'Vacated hostel on Feb 1st, clearance form signed by warden. Security refund pending.', prio: 'medium', stat: 'in_progress', next: 'staff', ageDays: 6, respDueMins: 480, resDueMins: 2880, overdue: true, responded: true, comments: [] },
    { id: 12, num: 'CC-2026-00112', req: 8, staff: 4, dept: 3, cat: 3, subject: 'Typo in student name on ID card chip data', desc: 'Name printed as Ananya Iyre instead of Ananya Iyer. Library scanner rejects the card.', prio: 'low', stat: 'resolved', next: 'student', ageDays: 8, respDueMins: 1440, resDueMins: 4320, responded: true, resolved: true, resolutionSummary: 'Card re-encoded and reprinted.', comments: [] },
    { id: 13, num: 'CC-2026-00113', req: 9, staff: 5, dept: 4, cat: 5, subject: 'Cannot login to Turnitin plagiarism software for M.Tech dissertation', desc: 'Activation email expired before link was clicked. Need reset link.', prio: 'high', stat: 'open', next: 'staff', ageDays: 1.5, respDueMins: 120, resDueMins: 1440, overdue: true, comments: [] },
    { id: 14, num: 'CC-2026-00114', req: 10, staff: 3, dept: 2, cat: 4, subject: 'Bonafide certificate for passport renewal application', desc: 'Passport seva kendra requires original stamped bonafide certificate with photo attestation.', prio: 'medium', stat: 'resolved', next: 'student', ageDays: 2.5, respDueMins: 480, resDueMins: 2880, responded: true, resolved: true, resolutionSummary: 'Certificate generated and signed.', comments: [] },
    { id: 15, num: 'CC-2026-00115', req: 11, staff: 2, dept: 1, cat: 1, subject: 'Education loan disbursement documentation confirmation', desc: 'SBI branch needs formal demand notice breakdown for semester 5 tuition and mess.', prio: 'medium', stat: 'waiting_for_student', next: 'student', ageDays: 2, respDueMins: 480, resDueMins: 2880, responded: true, comments: [] },
    { id: 16, num: 'CC-2026-00116', req: 12, staff: 3, dept: 2, cat: 2, subject: 'Attendance correction for Sports Meet participation', desc: 'Represented college at Inter-University Basketball tournament Feb 10-15.', prio: 'low', stat: 'in_progress', next: 'staff', ageDays: 4.5, respDueMins: 1440, resDueMins: 4320, overdue: true, responded: true, comments: [] },
    { id: 17, num: 'CC-2026-00117', req: 13, staff: 5, dept: 4, cat: 5, subject: 'Matlab network license server connection error in CAD Lab', desc: 'License manager error -15: Cannot connect to license server system on port 27000.', prio: 'high', stat: 'resolved', next: 'student', ageDays: 3, respDueMins: 120, resDueMins: 1440, responded: true, resolved: true, resolutionSummary: 'Restarted FlexLM license service.', comments: [] },
    { id: 18, num: 'CC-2026-00118', req: 14, staff: 6, dept: 5, cat: 6, subject: 'Hostel mess food quality grievance and cleanliness', desc: 'Repeated cold food served during dinner in Girls Hostel 2. Hygiene audit requested.', prio: 'medium', stat: 'in_progress', next: 'staff', ageDays: 1.2, respDueMins: 480, resDueMins: 2880, responded: true, comments: [] },
    { id: 19, num: 'CC-2026-00119', req: 15, staff: 4, dept: 3, cat: 3, subject: 'Damaged barcode on ID card prevents book issue at Central Library', desc: 'Lamination peeling off barcode strip. Library barcode scanner cannot read.', prio: 'low', stat: 'closed', next: 'student', ageDays: 14, respDueMins: 1440, resDueMins: 4320, responded: true, resolved: true, closed: true, resolutionSummary: 'Free re-lamination done.', comments: [] },
    { id: 20, num: 'CC-2026-00120', req: 16, staff: 2, dept: 1, cat: 1, subject: 'Tuition installment plan request due to family medical emergency', desc: 'Requesting permission to pay remaining 50% tuition in two installments in April and May.', prio: 'high', stat: 'in_progress', next: 'staff', ageDays: 0.8, respDueMins: 120, resDueMins: 1440, responded: true, comments: [] },
    { id: 21, num: 'CC-2026-00121', req: 7, staff: null, dept: 3, cat: 4, subject: 'Migration certificate required for foreign internship registration', desc: 'Need university migration clearance for MITACS Globalink research internship.', prio: 'medium', stat: 'open', next: 'manager', ageDays: 0.6, respDueMins: 480, resDueMins: 2880, comments: [] },
    { id: 22, num: 'CC-2026-00122', req: 8, staff: 3, dept: 2, cat: 2, subject: 'Clash between elective subjects in final exam timetable', desc: 'Machine Learning and Cloud Computing scheduled at the same time on March 28th 2 PM.', prio: 'urgent', stat: 'resolved', next: 'student', ageDays: 2, respDueMins: 30, resDueMins: 240, responded: true, resolved: true, resolutionSummary: 'CS409 moved to March 29th morning slot.', comments: [] },
    { id: 23, num: 'CC-2026-00123', req: 9, staff: 5, dept: 4, cat: 5, subject: 'Campus email inbox quota exceeded - not receiving placement emails', desc: 'Campus mailbox @student.edu bounced company invite because storage is full (5GB limit).', prio: 'urgent', stat: 'in_progress', next: 'staff', ageDays: 0.2, respDueMins: 30, resDueMins: 240, responded: true, comments: [] },
    { id: 24, num: 'CC-2026-00124', req: 10, staff: null, dept: 5, cat: 6, subject: 'Campus shuttle bus route 3 timings irregularity in morning', desc: 'Morning 8:15 AM bus from Metro station consistently arriving 30 minutes late.', prio: 'low', stat: 'open', next: 'manager', ageDays: 3.2, respDueMins: 1440, resDueMins: 4320, overdue: true, comments: [] },
    { id: 25, num: 'CC-2026-00125', req: 11, staff: 4, dept: 3, cat: 4, subject: 'Medium of instruction English proficiency certificate for IELTS waiver', desc: 'Applying for Masters abroad, university requires formal letter.', prio: 'medium', stat: 'resolved', next: 'student', ageDays: 5, respDueMins: 480, resDueMins: 2880, responded: true, resolved: true, resolutionSummary: 'Issued official English Medium of Instruction letter.', comments: [] },
    { id: 26, num: 'CC-2026-00126', req: 12, staff: 2, dept: 1, cat: 1, subject: 'Tax exemption certificate (Section 80E) for father education loan', desc: 'Need 80E interest and tuition fee break-up certificate for income tax return filing.', prio: 'low', stat: 'waiting_for_student', next: 'student', ageDays: 4, respDueMins: 1440, resDueMins: 4320, responded: true, comments: [] },
    { id: 27, num: 'CC-2026-00127', req: 13, staff: 3, dept: 2, cat: 2, subject: 'Re-evaluation score update missing on web transcript', desc: 'Re-evaluation result of Engineering Mathematics III improved grade from C to A, but portal still lists C.', prio: 'high', stat: 'in_progress', next: 'staff', ageDays: 1.8, respDueMins: 120, resDueMins: 1440, overdue: true, responded: true, comments: [] },
    { id: 28, num: 'CC-2026-00128', req: 14, staff: 6, dept: 5, cat: 6, subject: 'Gymnasium equipment broken in sports complex', desc: 'Cable snapped on leg press machine in student fitness center. Safety hazard.', prio: 'medium', stat: 'resolved', next: 'student', ageDays: 7, respDueMins: 480, resDueMins: 2880, responded: true, resolved: true, resolutionSummary: 'Equipment technician repaired the cable.', comments: [] },
    { id: 29, num: 'CC-2026-00129', req: 15, staff: 5, dept: 4, cat: 5, subject: 'Gitlab server SSH key authentication rejected in software lab', desc: 'Git push to internal institutional GitLab fails with Permission Denied (publickey).', prio: 'medium', stat: 'closed', next: 'student', ageDays: 11, respDueMins: 480, resDueMins: 2880, responded: true, resolved: true, closed: true, resolutionSummary: 'Re-uploaded clean Ed25519 key.', comments: [] },
    { id: 30, num: 'CC-2026-00130', req: 16, staff: 4, dept: 3, cat: 3, subject: 'Bus pass smart card authorization error on route 7', desc: 'Bus conductor scanner beeps red stating card expired, though annual pass was renewed.', prio: 'medium', stat: 'in_progress', next: 'staff', ageDays: 1.1, respDueMins: 480, resDueMins: 2880, responded: true, comments: [] },
    { id: 31, num: 'CC-2026-00131', req: 7, staff: 2, dept: 1, cat: 1, subject: 'Late fee fine waiver appeal due to bank server downtime', desc: 'Bank gateway was down on the last day of regular fee payment. Penalty charged.', prio: 'low', stat: 'open', next: 'staff', ageDays: 0.1, respDueMins: 1440, resDueMins: 4320, comments: [] },
    { id: 32, num: 'CC-2026-00132', req: 8, staff: 3, dept: 2, cat: 4, subject: 'Provisional degree certificate for job joining verification', desc: 'Accepted offer letter from TCS starting next month. HR requires provisional degree certificate.', prio: 'high', stat: 'waiting_for_student', next: 'student', ageDays: 1.5, respDueMins: 120, resDueMins: 1440, overdue: true, responded: true, comments: [] },
  ];

  const tickets = [];
  const allComments = [];
  const allHistory = [];

  let commentIdSeq = 1;
  let historyIdSeq = 1;

  for (const t of raw) {
    const createdAt = new Date(now - t.ageDays * ONE_DAY).toISOString();
    const createdTime = new Date(createdAt).getTime();
    const updatedAt = new Date(now - (t.ageDays * 0.3) * ONE_DAY).toISOString();

    let firstRespDue = new Date(createdTime + t.respDueMins * 60 * 1000).toISOString();
    let resDue = new Date(createdTime + t.resDueMins * 60 * 1000).toISOString();
    let firstRespAt = t.responded ? new Date(createdTime + (t.respDueMins * 0.5) * 60 * 1000).toISOString() : null;

    if (t.overdue && !t.resolved) {
      firstRespDue = new Date(createdTime + t.respDueMins * 60 * 1000).toISOString();
      resDue = new Date(createdTime + t.resDueMins * 60 * 1000).toISOString();
    }

    const resolvedAt = t.resolved ? new Date(createdTime + (t.resDueMins * 0.7) * 60 * 1000).toISOString() : null;
    const closedAt = t.closed ? new Date(createdTime + (t.resDueMins * 0.9) * 60 * 1000).toISOString() : null;

    tickets.push({
      id: t.id,
      ticket_number: t.num,
      requester_id: t.req,
      assigned_to_id: t.staff,
      department_id: t.dept,
      category_id: t.cat,
      subject: t.subject,
      description: t.desc,
      priority: t.prio,
      status: t.stat,
      resolution_summary: t.resolutionSummary || null,
      next_action_owner: t.next,
      first_response_due_at: firstRespDue,
      first_responded_at: firstRespAt,
      resolution_due_at: resDue,
      resolved_at: resolvedAt,
      closed_at: closedAt,
      reopen_count: 0,
      created_at: createdAt,
      updated_at: updatedAt,
    });

    allHistory.push({
      id: historyIdSeq++,
      ticket_id: t.id,
      actor_id: t.req,
      action_type: 'created',
      old_value: null,
      new_value: 'open',
      description: `Ticket submitted by student #${t.req}`,
      created_at: createdAt,
    });

    if (t.staff) {
      allHistory.push({
        id: historyIdSeq++,
        ticket_id: t.id,
        actor_id: 1,
        action_type: 'assigned',
        old_value: 'Unassigned',
        new_value: `Staff #${t.staff}`,
        description: `Ticket assigned to Staff #${t.staff}`,
        created_at: new Date(createdTime + 10 * 60 * 1000).toISOString(),
      });
    }

    if (t.comments) {
      for (const c of t.comments) {
        allComments.push({
          id: commentIdSeq++,
          ticket_id: t.id,
          author_id: c.author,
          content: c.text,
          visibility: c.vis,
          created_at: new Date(createdTime + 20 * 60 * 1000).toISOString(),
          updated_at: new Date(createdTime + 20 * 60 * 1000).toISOString(),
        });
      }
    }
  }

  const notifications = [
    { id: 1, user_id: 7, ticket_id: 1, type: 'ticket_status', message: 'Your ticket CC-2026-00101 was received and queued for IT Support.', is_read: 0, created_at: new Date().toISOString() },
    { id: 2, user_id: 8, ticket_id: 2, type: 'comment_added', message: 'Staff Ramesh Kulkarni commented on your ticket CC-2026-00102.', is_read: 0, created_at: new Date().toISOString() },
    { id: 3, user_id: 11, ticket_id: 5, type: 'waiting_student', message: 'Staff requested additional info on ticket CC-2026-00105.', is_read: 0, created_at: new Date().toISOString() },
    { id: 4, user_id: 12, ticket_id: 6, type: 'ticket_resolved', message: 'Your ticket CC-2026-00106 has been resolved.', is_read: 1, created_at: new Date().toISOString() },
    { id: 5, user_id: 2, ticket_id: 2, type: 'ticket_assigned', message: 'High priority ticket CC-2026-00102 was assigned to you.', is_read: 0, created_at: new Date().toISOString() },
    { id: 6, user_id: 3, ticket_id: 3, type: 'sla_breach', message: 'Ticket CC-2026-00103 has breached the resolution deadline!', is_read: 0, created_at: new Date().toISOString() },
    { id: 7, user_id: 1, ticket_id: 1, type: 'overdue_escalation', message: '3 tickets require managerial intervention due to SLA breach.', is_read: 0, created_at: new Date().toISOString() },
  ];

  return { tickets, allComments, allHistory, notifications };
}

class MockStore {
  constructor() {
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.departments = parsed.departments || INITIAL_DEPARTMENTS;
        this.categories = parsed.categories || INITIAL_CATEGORIES;
        this.slaPolicies = parsed.slaPolicies || INITIAL_SLA_POLICIES;
        this.users = parsed.users || INITIAL_USERS;
        this.tickets = parsed.tickets || [];
        this.comments = parsed.comments || [];
        this.history = parsed.history || [];
        this.notifications = parsed.notifications || [];
        return;
      }
    } catch (e) {
      console.warn('Failed to parse mock store from localStorage, resetting', e);
    }

    this.reset();
  }

  reset() {
    this.departments = [...INITIAL_DEPARTMENTS];
    this.categories = [...INITIAL_CATEGORIES];
    this.slaPolicies = [...INITIAL_SLA_POLICIES];
    this.users = [...INITIAL_USERS];

    const { tickets, allComments, allHistory, notifications } = generateSeedTickets();
    this.tickets = tickets;
    this.comments = allComments;
    this.history = allHistory;
    this.notifications = notifications;
    this.save();
  }

  save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          departments: this.departments,
          categories: this.categories,
          slaPolicies: this.slaPolicies,
          users: this.users,
          tickets: this.tickets,
          comments: this.comments,
          history: this.history,
          notifications: this.notifications,
        })
      );
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  // --- Auth ---
  login(email, password) {
    const user = this.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase().trim());
    if (!user) {
      throw new Error('Invalid email or password');
    }
    // Accept Password@123 or any test password for simplicity in mock mode
    return {
      token: `mock_jwt_token_${user.id}_${Date.now()}`,
      user: { ...user },
    };
  }

  demoLogin(email) {
    const user = this.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase().trim());
    if (!user) {
      throw new Error('Demo account not found');
    }
    return {
      token: `mock_jwt_token_${user.id}_${Date.now()}`,
      user: { ...user },
    };
  }

  getDemoAccounts() {
    return [
      { role: 'admin', label: 'Admin / Registrar', email: 'admin@campuscare.edu', name: 'Dr. Aris Thorne (Registrar)' },
      { role: 'staff', label: 'Staff: Accounts', email: 'finance.staff@campuscare.edu', name: 'Prof. Ramesh Kulkarni' },
      { role: 'staff', label: 'Staff: IT Support', email: 'it.staff@campuscare.edu', name: 'Kavita Menon' },
      { role: 'student', label: 'Student: Rahul', email: 'rahul.sharma@student.edu', name: 'Rahul Sharma (CS)' },
    ];
  }

  register(userData) {
    const existing = this.users.find((u) => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existing) {
      throw new Error('A user with this email already exists.');
    }
    const newUser = {
      id: this.users.length + 1,
      full_name: userData.full_name,
      email: userData.email,
      role: 'student',
      department_id: null,
      student_or_employee_id: userData.student_id || `2026-STU-${Math.floor(100 + Math.random() * 900)}`,
      is_active: 1,
    };
    this.users.push(newUser);
    this.save();
    return {
      token: `mock_jwt_token_${newUser.id}_${Date.now()}`,
      user: newUser,
    };
  }

  getCurrentUser(currentUser) {
    if (!currentUser) return null;
    return this.users.find((u) => u.id === currentUser.id) || currentUser;
  }

  // --- Tickets ---
  getTickets(params = {}, currentUser = null) {
    let list = [...this.tickets];

    // Filter by student if student role
    if (currentUser?.role === 'student') {
      list = list.filter((t) => t.requester_id === currentUser.id);
    } else if (currentUser?.role === 'staff' && params.scope === 'mine') {
      list = list.filter((t) => t.assigned_to_id === currentUser.id);
    }

    if (params.status && params.status !== 'all') {
      list = list.filter((t) => t.status === params.status);
    }
    if (params.priority && params.priority !== 'all') {
      list = list.filter((t) => t.priority === params.priority);
    }
    if (params.category_id && params.category_id !== 'all') {
      list = list.filter((t) => String(t.category_id) === String(params.category_id));
    }
    if (params.department_id && params.department_id !== 'all') {
      list = list.filter((t) => String(t.department_id) === String(params.department_id));
    }
    if (params.assigned_to) {
      if (params.assigned_to === 'unassigned') {
        list = list.filter((t) => !t.assigned_to_id);
      } else {
        list = list.filter((t) => String(t.assigned_to_id) === String(params.assigned_to));
      }
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (t) =>
          t.ticket_number.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Enrich tickets with category_name, department_name, requester_name, assigned_to_name
    const enriched = list.map((t) => {
      const cat = this.categories.find((c) => c.id === t.category_id);
      const dept = this.departments.find((d) => d.id === t.department_id);
      const req = this.users.find((u) => u.id === t.requester_id);
      const staff = this.users.find((u) => u.id === t.assigned_to_id);

      const now = Date.now();
      const isBreached =
        t.status !== 'resolved' &&
        t.status !== 'closed' &&
        t.resolution_due_at &&
        new Date(t.resolution_due_at).getTime() < now;

      return {
        ...t,
        category_name: cat?.name || 'General',
        department_name: dept?.name || 'Administration',
        requester_name: req?.full_name || 'Student',
        requester_email: req?.email || '',
        assigned_to_name: staff?.full_name || null,
        assigned_to_email: staff?.email || null,
        is_sla_breached: isBreached,
      };
    });

    return {
      tickets: enriched,
      total: enriched.length,
      page: 1,
      limit: 100,
    };
  }

  getTicket(id, currentUser = null) {
    const t = this.tickets.find((item) => String(item.id) === String(id));
    if (!t) throw new Error('Ticket not found');

    const cat = this.categories.find((c) => c.id === t.category_id);
    const dept = this.departments.find((d) => d.id === t.department_id);
    const req = this.users.find((u) => u.id === t.requester_id);
    const staff = this.users.find((u) => u.id === t.assigned_to_id);

    // Comments
    let ticketComments = this.comments.filter((c) => c.ticket_id === t.id);
    if (currentUser?.role === 'student') {
      ticketComments = ticketComments.filter((c) => c.visibility === 'public');
    }
    const enrichedComments = ticketComments.map((c) => {
      const author = this.users.find((u) => u.id === c.author_id);
      return {
        ...c,
        author_name: author?.full_name || 'User',
        author_role: author?.role || 'user',
      };
    });

    // History
    const ticketHistory = this.history
      .filter((h) => h.ticket_id === t.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((h) => {
        const actor = this.users.find((u) => u.id === h.actor_id);
        return {
          ...h,
          actor_name: actor?.full_name || 'System',
          actor_role: actor?.role || 'system',
        };
      });

    const now = Date.now();
    const isBreached =
      t.status !== 'resolved' &&
      t.status !== 'closed' &&
      t.resolution_due_at &&
      new Date(t.resolution_due_at).getTime() < now;

    return {
      ...t,
      category_name: cat?.name || 'General',
      department_name: dept?.name || 'Administration',
      requester_name: req?.full_name || 'Student',
      requester_email: req?.email || '',
      requester_student_id: req?.student_or_employee_id || '',
      assigned_to_name: staff?.full_name || null,
      assigned_to_email: staff?.email || null,
      is_sla_breached: isBreached,
      comments: enrichedComments,
      history: ticketHistory,
    };
  }

  createTicket(data, currentUser) {
    const cat = this.categories.find((c) => c.id === Number(data.category_id));
    const deptId = cat ? cat.department_id : 1;
    const prio = data.priority || 'medium';
    const policy = this.slaPolicies.find((p) => p.priority === prio) || { first_response_minutes: 480, resolution_minutes: 2880 };

    const now = new Date();
    const firstRespDue = new Date(now.getTime() + policy.first_response_minutes * 60 * 1000).toISOString();
    const resDue = new Date(now.getTime() + policy.resolution_minutes * 60 * 1000).toISOString();

    const newId = this.tickets.length > 0 ? Math.max(...this.tickets.map((t) => t.id)) + 1 : 1;
    const ticketNumber = `CC-2026-${String(newId + 100).padStart(5, '0')}`;

    const newTicket = {
      id: newId,
      ticket_number: ticketNumber,
      requester_id: currentUser ? currentUser.id : 7,
      assigned_to_id: null,
      department_id: deptId,
      category_id: Number(data.category_id) || 1,
      subject: data.subject,
      description: data.description,
      priority: prio,
      status: 'open',
      resolution_summary: null,
      next_action_owner: 'manager',
      first_response_due_at: firstRespDue,
      first_responded_at: null,
      resolution_due_at: resDue,
      resolved_at: null,
      closed_at: null,
      reopen_count: 0,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    this.tickets.unshift(newTicket);

    this.history.unshift({
      id: this.history.length + 1,
      ticket_id: newId,
      actor_id: currentUser ? currentUser.id : 7,
      action_type: 'created',
      old_value: null,
      new_value: 'open',
      description: 'Ticket created',
      created_at: now.toISOString(),
    });

    this.save();
    return { id: newId, ticket_number: ticketNumber, ticket: newTicket };
  }

  updateStatus(id, status, resolutionSummary, currentUser) {
    const t = this.tickets.find((item) => String(item.id) === String(id));
    if (!t) throw new Error('Ticket not found');

    const oldStatus = t.status;
    t.status = status;
    t.updated_at = new Date().toISOString();

    if (status === 'resolved') {
      t.resolution_summary = resolutionSummary || 'Resolved by staff';
      t.resolved_at = new Date().toISOString();
      t.next_action_owner = 'student';
    } else if (status === 'closed') {
      t.closed_at = new Date().toISOString();
      t.next_action_owner = 'student';
    } else if (status === 'in_progress') {
      t.next_action_owner = 'staff';
    } else if (status === 'waiting_for_student') {
      t.next_action_owner = 'student';
    }

    this.history.unshift({
      id: this.history.length + 1,
      ticket_id: t.id,
      actor_id: currentUser ? currentUser.id : 1,
      action_type: 'status_change',
      old_value: oldStatus,
      new_value: status,
      description: `Status changed from ${oldStatus} to ${status}${resolutionSummary ? `: ${resolutionSummary}` : ''}`,
      created_at: new Date().toISOString(),
    });

    this.save();
    return { success: true, ticket: t };
  }

  assignTicket(id, staffId, currentUser) {
    const t = this.tickets.find((item) => String(item.id) === String(id));
    if (!t) throw new Error('Ticket not found');

    const staff = this.users.find((u) => u.id === Number(staffId));
    const oldStaffId = t.assigned_to_id;
    t.assigned_to_id = staff ? staff.id : null;
    if (staff && t.status === 'open') {
      t.status = 'in_progress';
      t.next_action_owner = 'staff';
    }
    t.updated_at = new Date().toISOString();

    this.history.unshift({
      id: this.history.length + 1,
      ticket_id: t.id,
      actor_id: currentUser ? currentUser.id : 1,
      action_type: 'assigned',
      old_value: oldStaffId ? `Staff #${oldStaffId}` : 'Unassigned',
      new_value: staff ? staff.full_name : 'Unassigned',
      description: `Assigned to ${staff ? staff.full_name : 'Unassigned'}`,
      created_at: new Date().toISOString(),
    });

    this.save();
    return { success: true, ticket: t };
  }

  updatePriority(id, priority, currentUser) {
    const t = this.tickets.find((item) => String(item.id) === String(id));
    if (!t) throw new Error('Ticket not found');

    const oldPrio = t.priority;
    t.priority = priority;
    t.updated_at = new Date().toISOString();

    this.history.unshift({
      id: this.history.length + 1,
      ticket_id: t.id,
      actor_id: currentUser ? currentUser.id : 1,
      action_type: 'priority_change',
      old_value: oldPrio,
      new_value: priority,
      description: `Priority modified from ${oldPrio} to ${priority}`,
      created_at: new Date().toISOString(),
    });

    this.save();
    return { success: true, ticket: t };
  }

  reopenTicket(id, reason, currentUser) {
    const t = this.tickets.find((item) => String(item.id) === String(id));
    if (!t) throw new Error('Ticket not found');

    const oldStatus = t.status;
    t.status = 'in_progress';
    t.reopen_count = (t.reopen_count || 0) + 1;
    t.resolved_at = null;
    t.closed_at = null;
    t.next_action_owner = 'staff';
    t.updated_at = new Date().toISOString();

    this.history.unshift({
      id: this.history.length + 1,
      ticket_id: t.id,
      actor_id: currentUser ? currentUser.id : 7,
      action_type: 'reopened',
      old_value: oldStatus,
      new_value: 'in_progress',
      description: `Ticket reopened by student. Reason: ${reason || 'Issue persists'}`,
      created_at: new Date().toISOString(),
    });

    this.save();
    return { success: true, ticket: t };
  }

  addComment(ticketId, content, visibility, currentUser) {
    const t = this.tickets.find((item) => String(item.id) === String(ticketId));
    if (!t) throw new Error('Ticket not found');

    const newComment = {
      id: this.comments.length + 1,
      ticket_id: t.id,
      author_id: currentUser ? currentUser.id : 1,
      content,
      visibility: visibility || 'public',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.comments.push(newComment);

    if (currentUser?.role === 'staff' || currentUser?.role === 'admin') {
      if (!t.first_responded_at) {
        t.first_responded_at = new Date().toISOString();
      }
    }

    t.updated_at = new Date().toISOString();
    this.save();
    return newComment;
  }

  // --- Dashboards ---
  getAdminDashboard() {
    const now = Date.now();
    const total = this.tickets.length;
    const open = this.tickets.filter((t) => t.status === 'open').length;
    const inProgress = this.tickets.filter((t) => t.status === 'in_progress' || t.status === 'waiting_for_student').length;
    const resolved = this.tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;
    const slaBreached = this.tickets.filter(
      (t) => t.status !== 'resolved' && t.status !== 'closed' && t.resolution_due_at && new Date(t.resolution_due_at).getTime() < now
    ).length;

    // Categories
    const catMap = {};
    for (const c of this.categories) {
      catMap[c.id] = { id: c.id, name: c.name, count: 0 };
    }
    for (const t of this.tickets) {
      if (catMap[t.category_id]) catMap[t.category_id].count++;
    }

    // Priorities
    const priorities = { urgent: 0, high: 0, medium: 0, low: 0 };
    for (const t of this.tickets) {
      if (priorities[t.priority] !== undefined) priorities[t.priority]++;
    }

    // Recent
    const recent = this.getTickets({ limit: 10 }).tickets.slice(0, 8);

    const complianceRate = total > 0 ? Math.round(((total - slaBreached) / total) * 100) : 100;

    return {
      metrics: {
        total_tickets: total,
        open_tickets: open,
        in_progress_tickets: inProgress,
        resolved_tickets: resolved,
        sla_breaches: slaBreached,
        compliance_rate: complianceRate,
        avg_resolution_hours: 18.4,
      },
      categories: Object.values(catMap),
      priorities,
      recent_tickets: recent,
    };
  }

  getStaffDashboard(currentUser) {
    const staffId = currentUser?.id || 2;
    const now = Date.now();
    const myTickets = this.tickets.filter((t) => t.assigned_to_id === staffId);
    const assignedCount = myTickets.filter((t) => t.status !== 'closed').length;
    const overdueCount = myTickets.filter(
      (t) => t.status !== 'resolved' && t.status !== 'closed' && t.resolution_due_at && new Date(t.resolution_due_at).getTime() < now
    ).length;
    const highPriorityCount = myTickets.filter(
      (t) => (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'closed'
    ).length;
    const resolvedCount = myTickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;

    const recent = this.getTickets({ assigned_to: staffId }).tickets.slice(0, 8);

    return {
      metrics: {
        assigned_tickets: assignedCount,
        overdue_tickets: overdueCount,
        high_priority_tickets: highPriorityCount,
        resolved_tickets: resolvedCount,
      },
      recent_tickets: recent,
    };
  }

  getStudentDashboard(currentUser) {
    const studentId = currentUser?.id || 7;
    const myTickets = this.tickets.filter((t) => t.requester_id === studentId);
    const totalCount = myTickets.length;
    const activeCount = myTickets.filter((t) => t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting_for_student').length;
    const resolvedCount = myTickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;
    const waitingActionCount = myTickets.filter((t) => t.status === 'waiting_for_student').length;

    const recent = this.getTickets({}, currentUser).tickets.slice(0, 8);

    return {
      metrics: {
        total_tickets: totalCount,
        active_tickets: activeCount,
        resolved_tickets: resolvedCount,
        action_required_tickets: waitingActionCount,
      },
      recent_tickets: recent,
    };
  }

  // --- Staff Directory ---
  getStaff() {
    return this.users
      .filter((u) => u.role === 'staff' || u.role === 'admin')
      .map((s) => {
        const dept = this.departments.find((d) => d.id === s.department_id);
        const activeCount = this.tickets.filter(
          (t) => t.assigned_to_id === s.id && t.status !== 'resolved' && t.status !== 'closed'
        ).length;
        return {
          ...s,
          department_name: dept?.name || 'General Administration',
          active_tickets_count: activeCount,
        };
      });
  }

  getStaffRecommendation(categoryId) {
    const cat = this.categories.find((c) => c.id === Number(categoryId));
    const deptId = cat ? cat.department_id : null;
    const staffList = this.getStaff().filter((s) => (deptId ? s.department_id === deptId : true));
    staffList.sort((a, b) => a.active_tickets_count - b.active_tickets_count);
    return staffList[0] || null;
  }

  updateStaff(id, data) {
    const u = this.users.find((item) => item.id === Number(id));
    if (!u) throw new Error('Staff member not found');
    Object.assign(u, data);
    this.save();
    return u;
  }

  createStaff(data) {
    const newStaff = {
      id: this.users.length + 1,
      full_name: data.full_name,
      email: data.email,
      role: 'staff',
      department_id: Number(data.department_id) || 1,
      student_or_employee_id: data.employee_id || `STF-${100 + this.users.length}`,
      is_active: 1,
    };
    this.users.push(newStaff);
    this.save();
    return newStaff;
  }

  // --- Settings ---
  getCategories() {
    return this.categories.map((c) => {
      const dept = this.departments.find((d) => d.id === c.department_id);
      return { ...c, department_name: dept?.name || 'General' };
    });
  }

  createCategory(data) {
    const newCat = {
      id: this.categories.length + 1,
      name: data.name,
      description: data.description || '',
      department_id: Number(data.department_id) || 1,
    };
    this.categories.push(newCat);
    this.save();
    return newCat;
  }

  updateCategory(id, data) {
    const cat = this.categories.find((c) => c.id === Number(id));
    if (!cat) throw new Error('Category not found');
    Object.assign(cat, data);
    this.save();
    return cat;
  }

  getSlaPolicies() {
    return [...this.slaPolicies];
  }

  updateSlaPolicy(priority, data) {
    const p = this.slaPolicies.find((item) => item.priority === priority);
    if (!p) throw new Error('SLA policy not found');
    Object.assign(p, data);
    this.save();
    return p;
  }

  getDepartments() {
    return [...this.departments];
  }

  // --- Reports & Analytics ---
  getAnalytics() {
    const total = this.tickets.length;
    const resolved = this.tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;
    const now = Date.now();
    const breached = this.tickets.filter(
      (t) => t.status !== 'resolved' && t.status !== 'closed' && t.resolution_due_at && new Date(t.resolution_due_at).getTime() < now
    ).length;

    const complianceRate = total > 0 ? Math.round(((total - breached) / total) * 100) : 100;

    return {
      summary: {
        total_tickets: total,
        resolved_tickets: resolved,
        sla_compliance_rate: complianceRate,
        avg_turnaround_hours: 16.8,
        reopen_rate: '3.1%',
      },
      priority_stats: {
        urgent: { count: this.tickets.filter((t) => t.priority === 'urgent').length, compliance: '91%' },
        high: { count: this.tickets.filter((t) => t.priority === 'high').length, compliance: '94%' },
        medium: { count: this.tickets.filter((t) => t.priority === 'medium').length, compliance: '97%' },
        low: { count: this.tickets.filter((t) => t.priority === 'low').length, compliance: '99%' },
      },
    };
  }

  exportCsvBlob() {
    const tickets = this.getTickets({ limit: 1000 }).tickets;
    const headers = [
      'Ticket Number',
      'Subject',
      'Category',
      'Department',
      'Priority',
      'Status',
      'Requester',
      'Assigned Staff',
      'Created At',
      'Resolution Due',
      'Resolved At',
      'Resolution Summary',
    ];

    const rows = tickets.map((t) => [
      `"${t.ticket_number}"`,
      `"${(t.subject || '').replace(/"/g, '""')}"`,
      `"${t.category_name}"`,
      `"${t.department_name}"`,
      `"${t.priority}"`,
      `"${t.status}"`,
      `"${t.requester_name}"`,
      `"${t.assigned_to_name || 'Unassigned'}"`,
      `"${t.created_at}"`,
      `"${t.resolution_due_at || ''}"`,
      `"${t.resolved_at || ''}"`,
      `"${(t.resolution_summary || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  // --- Notifications ---
  getNotifications(currentUser) {
    const userId = currentUser?.id || 1;
    return this.notifications.filter((n) => n.user_id === userId);
  }

  markNotificationRead(id) {
    const n = this.notifications.find((item) => item.id === Number(id));
    if (n) {
      n.is_read = 1;
      this.save();
    }
    return { success: true };
  }

  markAllNotificationsRead(currentUser) {
    const userId = currentUser?.id || 1;
    this.notifications.forEach((n) => {
      if (n.user_id === userId) n.is_read = 1;
    });
    this.save();
    return { success: true };
  }
}

export const mockStore = new MockStore();
