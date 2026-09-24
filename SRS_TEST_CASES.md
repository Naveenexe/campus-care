# CampusCare — Complete SRS Test Cases & Validation Guide

This document provides both **Automated** and **Step-by-Step Manual** test cases corresponding to **Section 11 (Validation and Testing Requirements)** and all core Functional Requirements of the **CampusCare SRS**.

---

## ⚡ Quick Automated Test Execution

You can run the full automated verification test suite directly in your terminal at any time:

```bash
npm test
```
*Expected Result: 20/20 Test Cases Passed (100% Success Rate).*

---

## 📋 Comprehensive Test Cases Matrix (T-001 through T-020)

### Group 1: Authentication & Role-Based Access Control

#### **Test ID: T-001 — Student Login & Portal Initialization**
- **SRS Reference**: FR-001, FR-002, FR-046
- **Test Credentials**: `rahul.sharma@student.edu` / `Password@123` (or click **"Student: Rahul"** on login screen)
- **Manual Steps**:
  1. Open [http://localhost:3000](http://localhost:3000).
  2. If already logged in, click the Logout icon in the top right.
  3. Click the one-click demo button **"Student: Rahul"** (or enter credentials).
- **Expected Result**:
  - The browser redirects to the **Student Portal**.
  - A blue personalized welcome banner is displayed: *"Hello, Rahul Sharma"*.
  - Counters show: *Total Requests*, *Active Requests*, *Waiting for Your Reply*, and *Resolved*.
  - The table lists Rahul's recent tickets.
- **Status**: `[✔] PASS`

---

#### **Test ID: T-002 — Staff Login & Assigned Workload View**
- **SRS Reference**: FR-001, FR-002, FR-045
- **Test Credentials**: `finance.staff@campuscare.edu` / `Password@123` (or click **"Staff: Accounts"**)
- **Manual Steps**:
  1. Use the top navbar dropdown **"Switch Role / Demo User"** and select **"Prof. Ramesh Kulkarni (STAFF • Accounts & Finance)"**.
- **Expected Result**:
  - The UI instantly switches to the **Staff Support Workspace**.
  - Displays KPI cards: *Active Workload*, *Overdue Tickets*, *Approaching SLA*, and *Unassigned In Dept*.
  - Section shows *"Priority Breaches (Overdue)"* and *"Approaching SLA Target"*.
  - Active in-progress queue displays assigned tickets.
- **Status**: `[✔] PASS`

---

#### **Test ID: T-003 — Admin Login & Executive Oversight Dashboard**
- **SRS Reference**: FR-001, FR-002, FR-041 to FR-044
- **Test Credentials**: `admin@campuscare.edu` / `Password@123` (or click **"Admin / Registrar"**)
- **Manual Steps**:
  1. Switch user to **"Dr. Aris Thorne (ADMIN)"**.
- **Expected Result**:
  - Loads **Executive Operations Dashboard**.
  - Live KPI cards: Total inquiries, open/active counts, overdue tickets, SLA compliance percentage, and average resolution turnaround hours.
  - Interactive SVG Donut chart (*Ticket Lifecycle Distribution*).
  - Bar chart (*Volume by Department / Category*).
  - Ticket Ageing Histogram bins (`< 24h`, `1–3 Days`, `3–7 Days`, `> 7 Days`).
  - Staff workload distribution bars and recent system audit feed.
- **Status**: `[✔] PASS`

---

### Group 2: Ticket Creation, Identification & Validation

#### **Test ID: T-004 — Student Creates Support Ticket**
- **SRS Reference**: FR-007, FR-008, BR-001, BR-002, BR-003
- **Test User**: Student (`rahul.sharma@student.edu`)
- **Manual Steps**:
  1. Switch to Student role and click **"Raise Support Ticket"** (or navigate to *Raise Support Ticket* from sidebar).
  2. Select Category: **"Fees and Payments"**.
  3. Select Priority: **"High"**.
  4. Enter Subject: `Semester 4 examination fee receipt discrepancy` (>= 5 characters).
  5. Enter Description: `Amount debited via UPI reference 99201928, but status shows unpaid on student ledger.` (>= 10 characters).
  6. Click **"Submit Support Ticket"**.
- **Expected Result**:
  - Submission succeeds and shows the green confirmation screen.
  - Generates a unique human-readable ticket ID format: `CC-2026-XXXXX`.
  - Automatically calculates `first_response_due_at` and `resolution_due_at` based on High priority SLA policy.
  - System creates an initial audit history entry: *"Ticket CC-2026-XXXXX created by Rahul Sharma"*.
- **Status**: `[✔] PASS`

---

#### **Test ID: T-018 — Form Validation & Error Handling on Ticket Submission**
- **SRS Reference**: FR-007, BR-003, 8.4
- **Test User**: Student
- **Manual Steps**:
  1. Open the **Raise Support Ticket** screen.
  2. Enter Subject: `Hi` (2 letters, less than required 5).
  3. Enter Description: `Help` (4 letters, less than required 10).
  4. Submit the form.
- **Expected Result**:
  - Form validation prevents submission.
  - An alert banner displays: *"Subject must be at least 5 characters"* or *"Description must be at least 10 characters"*.
  - No partial ticket is saved in the database.
- **Status**: `[✔] PASS`

---

### Group 3: Privacy, Data Isolation & RBAC Security

#### **Test ID: T-005 — Student Attempts Access to Another Student's Ticket**
- **SRS Reference**: FR-009, BR-005, 8.1
- **Test User**: Student Rahul (ID: 7) attempting to access Ananya's Ticket (ID: 2)
- **Manual Steps**:
  1. Login as Student Rahul Sharma.
  2. In your browser console or terminal, execute:
     ```javascript
     fetch('http://localhost:5000/api/tickets/2', {
       headers: { Authorization: `Bearer ${localStorage.getItem('campuscare_token')}` }
     }).then(r => console.log('HTTP Status:', r.status));
     ```
- **Expected Result**:
  - Returns **HTTP 403 Forbidden**.
  - Message: *"Forbidden: You do not have permission to view this ticket"*.
  - Student never sees unauthorized student requests in their list.
- **Status**: `[✔] PASS`

---

#### **Test ID: T-008 — Privacy Isolation: Internal Notes Hidden From Students**
- **SRS Reference**: FR-026, BR-006
- **Test Users**: Staff Ramesh Kulkarni & Student Rahul Sharma
- **Manual Steps**:
  1. Login as **Staff (Prof. Ramesh Kulkarni)**.
  2. Open any ticket raised by Rahul (or `CC-2026-00101`).
  3. In the reply box, select the radio button **"Internal Staff Note (Lock Icon)"**.
  4. Type: `CONFIDENTIAL: Internal verification pending with Accounts bank reconciliation batch.`
  5. Click **"Post Reply"**. Notice the yellow/amber card with the **Lock** badge.
  6. Switch user in the navbar to **Student (Rahul Sharma)**.
  7. Open the same ticket.
- **Expected Result**:
  - The internal note is **completely omitted** from the student's thread.
  - Student only sees public communication.
  - Server-side filter enforces this even if requested directly via API.
- **Status**: `[✔] PASS`

---

#### **Test ID: T-017 — Staff Unauthorized Action Denied**
- **SRS Reference**: FR-006, 8.1
- **Test User**: Staff Member
- **Manual Steps**:
  1. Staff attempts to create or modify system settings/categories:
     ```javascript
     fetch('http://localhost:5000/api/settings/categories', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${localStorage.getItem('campuscare_token')}`
       },
       body: JSON.stringify({ name: 'Hacked Category' })
     }).then(r => console.log('HTTP Status:', r.status));
     ```
- **Expected Result**:
  - Returns **HTTP 403 Forbidden**.
  - Operation is denied; only Admins possess configuration privileges.
- **Status**: `[✔] PASS`

---

### Group 4: Assignment, Workflow & Status Lifecycle

#### **Test ID: T-006 — Ticket Assignment & Workload Recommendation**
- **SRS Reference**: FR-013, FR-014, FR-016, FR-017
- **Test User**: Admin / Registrar
- **Manual Steps**:
  1. Navigate to **Ticket Management** as Admin.
  2. Click on an unassigned ticket (e.g., `CC-2026-00108` or newly created ticket).
  3. Click **"Assign Staff"** in the top action bar.
  4. Note the green card showing the **Recommended Staff Member** with lowest active workload.
  5. Click **"Apply"** or choose a staff member, then click **"Confirm Assignment"**.
- **Expected Result**:
  - The ticket assignee immediately updates.
  - An audit history entry is recorded with previous assignee, new assignee, actor, and timestamp.
  - Assigned staff receives an in-app notification.
- **Status**: `[✔] PASS`

---

#### **Test ID: T-007 — Staff Public Reply & First-Response SLA Tracking**
- **SRS Reference**: FR-025, FR-032
- **Test User**: Staff Member
- **Manual Steps**:
  1. Open an assigned ticket that has not yet received a reply.
  2. Select **"Public Reply (Student can see)"**.
  3. Type: `We are verifying your transaction with the payment gateway.` and post.
- **Expected Result**:
  - Reply appears in a clean blue/gray card.
  - Ticket records `first_responded_at` timestamp.
  - Student receives an in-app notification.
- **Status**: `[✔] PASS`

---

#### **Test ID: T-009 — Resolve Ticket without Summary (Rejected)**
- **SRS Reference**: FR-021, BR-007
- **Test User**: Staff or Admin
- **Manual Steps**:
  1. Attempt to resolve a ticket via direct API without a summary or with whitespace:
     ```javascript
     fetch('http://localhost:5000/api/tickets/1/status', {
       method: 'PATCH',
       headers: {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${localStorage.getItem('campuscare_token')}`
       },
       body: JSON.stringify({ status: 'resolved', resolution_summary: '' })
     }).then(r => r.json()).then(console.log);
     ```
- **Expected Result**:
  - Server rejects the request with **HTTP 400 Bad Request**.
  - Error: *"A resolution summary of at least 5 characters is required before resolving a ticket."*
- **Status**: `[✔] PASS`

---

#### **Test ID: T-010 — Resolve Ticket with Mandatory Summary**
- **SRS Reference**: FR-021, FR-022, BR-007
- **Test User**: Staff or Admin
- **Manual Steps**:
  1. Open an active ticket in **Ticket Details**.
  2. Click the green **"Resolve"** button in the header.
  3. In the modal, provide a detailed summary: `Reconciliation verified with merchant portal. Duplicate charge refunded to bank account.`
  4. Click **"Complete & Resolve"**.
- **Expected Result**:
  - Ticket moves to **Resolved** status with an emerald badge.
  - The green **Official Resolution Summary** card renders in the ticket view.
  - Audit trail appends the resolution event.
- **Status**: `[✔] PASS`

---

#### **Test ID: T-011 — Student Reopens an Eligible Resolved Ticket**
- **SRS Reference**: FR-023, BR-008
- **Test User**: Student
- **Manual Steps**:
  1. Switch to Student user who owns the resolved ticket.
  2. Open the resolved ticket. Notice the **"Reopen Ticket"** button.
  3. Click **"Reopen Ticket"**.
  4. Enter Reason: `The refund is not reflecting in the bank statement yet.`
  5. Submit.
- **Expected Result**:
  - Ticket status switches back to **In Progress**.
  - `reopen_count` increments to `1`.
  - Next Action Expected shifts back to **Staff**.
  - Audit trail records: *"Ticket reopened: The refund is not reflecting in the bank statement yet."*
- **Status**: `[✔] PASS`

---

### Group 5: SLA Engine, Overdue Detection & Search/Filter

#### **Test ID: T-012 — Overdue Detection & Escalation Indicators**
- **SRS Reference**: FR-033, FR-034, FR-038, BR-010
- **Test User**: Any authenticated user
- **Manual Steps**:
  1. Open **Ticket Management** or **Admin Dashboard**.
  2. Locate ticket `CC-2026-00101` (Lab Wi-Fi exam failure) or `CC-2026-00103`.
- **Expected Result**:
  - Ticket displays the pulsing red **"Overdue"** badge.
  - Appears in the **"Priority Breaches"** and **"Action Required: Overdue Tickets"** cards.
  - Dynamic evaluation compares current clock against `resolution_due_at`.
- **Status**: `[✔] PASS`

---

#### **Test ID: T-013 — Multi-Facet Filtering by Priority, Status & Category**
- **SRS Reference**: FR-012, FR-040
- **Manual Steps**:
  1. Navigate to **Ticket Management**.
  2. Select Priority filter dropdown: **"Urgent"**.
- **Expected Result**:
  - The table immediately updates to display only Urgent tickets.
  - All returned rows show the red *Urgent* badge.
  - Count updates (e.g., *Showing 5 of 5 tickets*).
- **Status**: `[✔] PASS`

---

#### **Test ID: T-014 — Search by Ticket Number & Subject**
- **SRS Reference**: FR-012
- **Manual Steps**:
  1. In the search bar on **Ticket Management**, type: `CC-2026-00102`.
  2. Click **"Search"**.
- **Expected Result**:
  - Exactly one matching ticket is returned (`CC-2026-00102 - Semester 4 tuition deducted twice`).
- **Status**: `[✔] PASS`

---

### Group 6: Analytics, Settings, CSV Export & Persistence

#### **Test ID: T-015 — Dashboard Metrics Derived From Persisted Data**
- **SRS Reference**: FR-041, BR-011
- **Manual Steps**:
  1. Navigate to **Admin Dashboard**.
  2. Note total inquiries count.
  3. Create a new ticket as a student.
  4. Return to Admin Dashboard and refresh.
- **Expected Result**:
  - Total inquiry count increases by 1.
  - Category and status counts update dynamically from SQL queries on persisted tables (not hardcoded dummy numbers).
- **Status**: `[✔] PASS`

---

#### **Test ID: T-016 — Session Logout & Protected Route Enforcement**
- **SRS Reference**: FR-004, FR-006, 8.1
- **Manual Steps**:
  1. Click the **Logout** icon in the navbar.
  2. Try navigating to or requesting `/api/tickets` without a token.
- **Expected Result**:
  - `localStorage` token is wiped.
  - The application returns to the **Login** screen.
  - Any protected API request without valid Bearer token returns **HTTP 401 Unauthorized**.
- **Status**: `[✔] PASS`

---

#### **Test ID: T-019 & T-020 — Comment Persistence & Database Integrity Across Restarts**
- **SRS Reference**: 5.9, 8.3, BR-012
- **Manual Steps**:
  1. Post a comment on any ticket.
  2. Refresh the browser (F5) or restart the backend server.
  3. Reopen the ticket.
- **Expected Result**:
  - All comments, audit history entries, ticket statuses, and timestamps are intact from `server/campuscare.db`.
  - SQLite WAL mode ensures consistent data integrity.
- **Status**: `[✔] PASS`

---

#### **Test ID: FR-049 — CSV Report Data Export**
- **SRS Reference**: FR-047, FR-049
- **Test User**: Admin or Staff
- **Manual Steps**:
  1. Navigate to **Reports & Analytics** from the sidebar.
  2. Click the blue **"Export CSV Report"** button (or on the Ticket List page).
- **Expected Result**:
  - Browser downloads a file named `campuscare_tickets_<timestamp>.csv`.
  - Open the file in Excel or text editor: Contains clean CSV headers (*Ticket Number, Subject, Requester Name, Requester Email, Department, Category, Priority, Status, Assignee, SLA State, Created Date, First Response Date, Resolved Date, Resolution Summary*).
- **Status**: `[✔] PASS`
