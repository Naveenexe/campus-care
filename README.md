# CampusCare — Student Support & Administrative Ticket Management System

> **Edumerge Solutions Recruitment Assessment · Assignment 4**  
> **Full-Stack Demonstrable Prototype**

CampusCare is a centralized student support and ticket lifecycle management platform designed for colleges and educational institutions. It replaces fragmented email, phone, and in-person requests with a structured, transparent, and traceable service workflow with real-time SLA deadline monitoring.

---

## 🚀 Key Highlights & Architectural Features

- **Full-Stack Architecture**: Built with an Express REST API backend and a responsive React frontend.
- **Relational Data Persistence**: Powered by SQLite via `better-sqlite3` with foreign key enforcement, WAL mode, transaction isolation, and performance indexes.
- **Role-Based Access Control (RBAC)**:
  - **Student**: Submit tickets, track personal requests, converse via public replies, and reopen eligible resolved tickets. Restrictive access ensures students never see another student's tickets or private internal notes.
  - **Support Staff**: Queue management, departmental triage, status transitions, SLA deadline tracking, public replies, and **private internal notes**.
  - **Admin / Manager**: Organization-wide oversight, workload-based staff assignment suggestions, SLA policy configuration, ticket ageing analytics, and CSV data export.
- **Real-Time SLA Engine**: Dynamic calculation of first-response and resolution deadlines across four priority tiers (`urgent`, `high`, `medium`, `low`), overdue detection, approaching deadline flags, and configurable pause rules.
- **Rich SaaS Design**: Clean layout, modern Google Fonts (*Plus Jakarta Sans* & *Inter*), color-coded priority/status badges, and pure SVG analytical charts.

---

## 📋 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or later (Tested on Node v24.x)
- **npm**: v9.0.0 or later

### Installation & Run

1. **Clone or Navigate to the Directory**:
   ```bash
   cd "campus care"
   ```

2. **Install Dependencies** (if not already installed):
   ```bash
   npm install
   ```

3. **Seed Database** (Populates 16 accounts, 5 departments, 6 categories, and 32 realistic tickets):
   ```bash
   npm run seed
   ```

4. **Launch Application** (Runs both the Express API on port 5000 and the Vite dev server on port 3000):
   ```bash
   npm run dev
   ```

5. **Access CampusCare in your Browser**:
   - Web Application: **[http://localhost:3000](http://localhost:3000)**
   - Backend API Healthcheck: **[http://localhost:5000/api/health](http://localhost:5000/api/health)**

---

## 🔑 Demo Accounts & Credentials

All demo accounts share the standard password: `Password@123`  
*Alternatively, use the **One-Click Instant Login** buttons on the login page or the **Switch Role / Demo User** menu in the top navigation bar.*

| Role | Name | Email | Department / Specialization |
| :--- | :--- | :--- | :--- |
| **Admin / Manager** | Dr. Aris Thorne | `admin@campuscare.edu` | Central Administration & Registrar |
| **Support Staff** | Prof. Ramesh Kulkarni | `finance.staff@campuscare.edu` | Accounts & Finance |
| **Support Staff** | Dr. Sunita Deshmukh | `academics.staff@campuscare.edu` | Academic Affairs |
| **Support Staff** | Mark Fernandes | `registry.staff@campuscare.edu` | Student Services & Registry |
| **Support Staff** | Kavita Menon | `it.staff@campuscare.edu` | IT Support & Systems |
| **Student** | Rahul Sharma | `rahul.sharma@student.edu` | Computer Science (Roll: 2023-CS-042) |
| **Student** | Ananya Iyer | `ananya.iyer@student.edu` | Electronics (Roll: 2023-EC-015) |
| **Student** | Vikram Patel | `vikram.patel@student.edu` | Mechanical (Roll: 2022-ME-088) |

---

## 🗄️ Database Schema & Entities

The SQLite database (`server/campuscare.db`) enforces relational integrity across 8 core entities:

1. **`users`**: User identities, bcrypt password hashes, roles (`student`, `staff`, `admin`), department links, employee/roll numbers.
2. **`departments`**: Accounts & Finance, Academic Affairs, Student Services, IT Support, General Admin.
3. **`ticket_categories`**: Fees & Payments, Attendance, ID Cards, Documents & Certificates, Technical Support, General Administration.
4. **`sla_policies`**: Configurable response and resolution targets for `urgent`, `high`, `medium`, and `low` priorities.
5. **`tickets`**: Master ticket records with unique numbers (`CC-2026-XXXXX`), status, priority, SLA deadlines, timestamps, and resolution summaries.
6. **`ticket_comments`**: Threaded conversation partitioned by `visibility` (`public` vs `internal`).
7. **`ticket_history`**: Append-only audit trail logging actors, action types, old/new values, and timestamps.
8. **`notifications`**: In-app notifications with read status and ticket deep links.

---

## 📡 API Reference Overview

| Endpoint | Method | Role | Description |
| :--- | :---: | :--- | :--- |
| `/api/auth/login` | `POST` | Public | Authenticate with email/password and obtain JWT. |
| `/api/auth/demo-login` | `POST` | Public | Instant password-less login for test accounts. |
| `/api/tickets` | `GET` | Authenticated | List tickets with filters (status, priority, category, assignee, SLA state) and pagination. |
| `/api/tickets/:id` | `GET` | Authenticated | Fetch ticket details, comments (filtered by role), and audit history. |
| `/api/tickets` | `POST` | Student, Admin | Raise a new ticket with automatic SLA deadline calculation. |
| `/api/tickets/:id/status` | `PATCH` | Staff, Admin | Transition ticket state (e.g. resolving requires a summary). |
| `/api/tickets/:id/assign` | `PATCH` | Staff, Admin | Assign ticket to staff with workload recommendations. |
| `/api/tickets/:id/priority`| `PATCH` | Staff, Admin | Recalculate SLA targets upon priority change. |
| `/api/tickets/:id/reopen` | `POST` | Student | Reopen resolved ticket with recorded reason. |
| `/api/tickets/:id/comments`| `POST` | Authenticated | Post public replies or private internal notes (staff only). |
| `/api/dashboard/admin` | `GET` | Admin | Real-time KPIs, category distribution, staff workloads, ageing analysis. |
| `/api/dashboard/staff` | `GET` | Staff | Assigned tickets, pending queues, approaching/overdue SLA alerts. |
| `/api/dashboard/student`| `GET` | Student | Overview of personal requests, active tickets, and waiting replies. |
| `/api/reports/analytics` | `GET` | Staff, Admin | Resolution metrics and SLA compliance rates with date filters. |
| `/api/reports/export-csv` | `GET` | Staff, Admin | Download filtered ticket register as CSV. |
| `/api/settings/sla-policies`| `PUT`| Admin | Update SLA response and resolution targets. |
| `/api/notifications` | `GET` | Authenticated | User notification feed with unread counter. |

---

## 🧪 Validation & Test Scenario Matrix (T-001 to T-020)

| Test ID | Scenario | Verification in CampusCare |
| :--- | :--- | :--- |
| **T-001** | Student logs in | Student portal loads with welcome banner, personal stats, and active tickets. |
| **T-002** | Staff logs in | Staff dashboard loads showing personal workload, overdue items, and approaching SLAs. |
| **T-003** | Admin logs in | Executive dashboard loads with institutional KPIs, ageing bins, charts, and workload. |
| **T-004** | Student creates ticket | Validates fields, generates unique human ID (e.g. `CC-2026-00133`), calculates SLAs. |
| **T-005** | Student accesses another ticket | Server validates `requester_id` and rejects with HTTP `403 Forbidden`. |
| **T-006** | Manager assigns a ticket | Assignee is updated, history records old and new assignees, notification sent. |
| **T-007** | Staff adds a public reply | Reply appears in blue bubble; visible to student. Sets `first_responded_at`. |
| **T-008** | Staff adds internal note | Note displays amber background with lock icon; hidden from student view. |
| **T-009** | Resolve without summary | Request is rejected with error: *A resolution summary is required before resolving*. |
| **T-010** | Resolve with summary | Ticket transitions to `Resolved`, summary is stored, requester is notified. |
| **T-011** | Student reopens ticket | Ticket moves to `In Progress`, increments `reopen_count`, logs reason in history. |
| **T-012** | SLA deadline passes | Ticket is dynamically evaluated and displays the red `Overdue` badge. |
| **T-013** | Filter by priority | Table filters dynamically by Urgent, High, Medium, or Low. |
| **T-014** | Search by ticket number | Searching `CC-2026-00101` returns the exact ticket record. |
| **T-015** | Dashboard metrics | Metrics are calculated dynamically from SQL queries on persisted tables. |
| **T-016** | User logs out | Clears JWT token from `localStorage` and redirects to login screen. |
| **T-017** | Unauthorized actions | Backend route middleware validates roles and rejects unauthorized actions. |
| **T-018** | Invalid input submission | Form inputs enforce min lengths (5 chars subject, 10 chars description). |
| **T-019** | Comments persistence | Comments and history persist in SQLite database across page reloads. |
| **T-020** | Application restart | All SQLite data remains preserved and immediately available upon server restart. |

---

## 🤖 AI Usage Report (Mandatory)

The complete, submission-ready **AI Usage Report** adhering to the Edumerge Solutions assessment guidelines is documented in **[`AI_USAGE_REPORT.md`](file:///c:/Users/admin/Downloads/campus%20care/AI_USAGE_REPORT.md)**.

A brief summary:
1. **Tools Used**: ChatGPT (Planning, Problem Analysis, SRS Document Preparation) & Google DeepMind Antigravity Agentic IDE (Full-Stack Implementation, Architecture, Testing & Verification).
2. **Prompts & Directives**: 
   - Full implementation of the Software Requirements Specification (SRS) for Assignment 4 (Student Support & Ticket Management).
   - Enforced backend validation, persistent SQLite data storage, role-based authorization, SLA tracking engine, and a modern SaaS interface.
3. **Key Architectural Decisions Made**:
   - Used `better-sqlite3` for synchronous database execution with zero asynchronous query drift and immediate transactional safety.
   - Enforced server-side data sanitization and authorization checks for public vs. internal notes.
   - Built a dynamic SLA evaluator calculating both first response and resolution targets against active system clock time.
4. **Validation**: All 20 test cases (T-001 through T-020) executed and passing (`npm test`).
