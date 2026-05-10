# MindTrack Ecosystem: Revised Unified System Architecture

## 1. Purpose and Scope

This document replaces the previous "three separate applications" model with a **single web platform** that supports multiple user types through **Role-Based Access Control (RBAC)**.

The revised architecture is designed for:

- A unified frontend using **React.js + Tailwind CSS**
- A centralized backend server for all business logic and data persistence
- Secure role-specific experiences inside one application
- Server-stored data that can be transformed into reports and exported as PDF on demand
- Frontend PDF generation using **React PDF Renderer** (`@react-pdf/renderer`)

---

## 2. Key Changes from Previous Version

## 2.1 Architecture Model Change

**Old:** Three separate apps:
- Client App
- Professionals App
- Admin App

**New:** One web application with protected role-based portals:
- Client role portal
- Professional role portal
- Admin/Owner role portal
- HR role portal

## 2.2 Data Ownership and Report Flow

**Old:** Mixed references to report generation and export flows.

**New:** All operational data is stored server-side in a centralized database.  
Reports are:
1. Generated from server data via reporting endpoints
2. Sent to frontend as structured JSON payloads
3. Rendered to PDF in frontend using `@react-pdf/renderer`

## 2.3 Frontend Technology Clarification

**Mandatory frontend stack:**
- React.js
- Tailwind CSS
- React Router
- `@react-pdf/renderer` for report export

---

## 3. High-Level System Architecture

## 3.1 Components

1. **Frontend (React.js + Tailwind CSS)**
   - Single codebase
   - Role-aware routing and views
   - Dashboard modules for each role
   - PDF report pages and export controls

2. **Backend API Server**
   - Authentication and authorization
   - Domain services (tasks, mood surveys, appointments, chat, complaints, reporting)
   - AI integration layer (Gemini-driven recommendations and insights)
   - Audit/event logging

3. **Database**
   - Central source of truth
   - Stores users, role mappings, surveys, medications, tasks, appointments, chats, reports metadata, complaints, and moderation decisions

4. **Background Workers / Scheduled Jobs**
   - Weekly/monthly/yearly aggregation jobs
   - Notification scheduling (reminders)
   - Ticket distribution for staff workload balancing

5. **File Storage (optional but recommended)**
   - Profile images, credential documents, CV files, and attachment artifacts

---

## 4. Roles and Access Control (RBAC)

## 4.1 Core Roles

- `CLIENT`
- `PROFESSIONAL`
- `HR`
- `ADMIN`
- `OWNER`

## 4.2 Access Principles

- Every endpoint checks authentication and role authorization.
- Sensitive actions require elevated permissions:
  - Credential approvals: `HR`, `ADMIN`, `OWNER`
  - Role/grant management: `ADMIN`, `OWNER`
  - System-wide moderation actions: `ADMIN`, `OWNER`
- Fine-grained permissions are represented as claims/scopes for future extensibility.

## 4.3 Route Protection (Frontend)

Frontend routes are grouped as:
- Public routes (`/login`, `/signup`, `/legal`, `/forgot-password`)
- Authenticated shared routes (`/profile`, `/settings`, `/notifications`)
- Role-only routes (`/client/*`, `/professional/*`, `/admin/*`, `/hr/*`)

Unauthorized access attempts redirect to a safe default with an explanatory message.

---

## 5. Unified User Journey

## 5.1 Entry and Onboarding

1. Splash/Logo screen
2. Sign Up / Login
3. Optional Google authentication
4. Terms and Conditions acceptance
5. 2FA enrollment and validation
6. Role-aware landing page

## 5.2 Professional Verification Workflow

- Professional signup creates an account with `PENDING_VERIFICATION`.
- Credentials (degree, institution, batch, CV, registration) are uploaded.
- HR/Admin review request and either approve or reject with reason.
- On approval:
  - role privileges are activated
  - professional profile appears in discovery/search

---

## 6. Functional Modules

## 6.1 Client Domain

- Profile and personalization (theme, quote category, preferences)
- Goal and task management with recurrence/frequency
- Daily Mood Survey (base form immutable; extension fields configurable)
- Medication tracking and adherence logs
- Mood-medication correlation insights
- Professional discovery and booking
- Secure session chat (schedule-aware lock/unlock)
- Fraud reporting

## 6.2 Professional Domain

- Client panel (active, pending, archived)
- Appointment and availability management
- Intake and request inbox
- Chat controls and time-window restrictions
- External (non-platform) client scheduling support
- Abuse reporting against client accounts
- Ratings and reviews visibility

## 6.3 Admin/HR Domain

- Verification queue processing
- Complaint and abuse moderation
- Ticket assignment and balancing
- User/professional suspension and ban lifecycle
- Employee/user management (HR + Admin/Owner)
- Role assignment and privilege governance (Admin/Owner)

---

## 7. Data and Storage Architecture

All data is persisted on the server. The frontend does not act as a source of truth.

## 7.1 Core Entities

### User
- `id`, `email`, `password_hash`, `phone`
- `is_2fa_enabled`, `status`, `created_at`, `updated_at`

### UserRole
- `user_id`, `role`, `granted_by`, `granted_at`

### UserProfile
- `user_id`, `name`, `nickname`, `age`, `religion`, `education_level`, `country`
- `preferences_json` (theme, quote type, UI settings)

### MedicalProfile
- `user_id`, `mental_conditions`, `emergency_contact`

### MoodSurvey
- `id`, `user_id`, `survey_date`, `answers_json`, `extra_fields_json`

### MedicationLog
- `id`, `user_id`, `medication_name`, `dosage`, `intake_time`, `adherence_status`, `notes`

### Goal
- `id`, `user_id`, `title`, `description`, `target_date`, `status`

### Task
- `id`, `goal_id`, `title`, `frequency`, `scheduled_date`, `completion_status`, `completion_reason`

### ProfessionalProfile
- `user_id`, `display_name`, `specialization`, `fee`, `rating`, `availability_json`, `verification_status`

### ProfessionalVerification
- `id`, `professional_user_id`, `degree`, `institution`, `batch`, `cv_file_url`, `company_registration`, `review_status`, `review_notes`

### Appointment
- `id`, `client_user_id`, `professional_user_id`, `mode`, `start_time`, `end_time`, `status`

### ChatSession
- `id`, `client_user_id`, `professional_user_id`, `is_locked`, `lock_policy_json`

### ChatMessage
- `id`, `chat_session_id`, `sender_user_id`, `message_type`, `content`, `attachment_url`, `sent_at`

### Complaint
- `id`, `reported_by`, `reported_user_id`, `category`, `evidence_url`, `status`, `resolution_notes`

### ReportSnapshot
- `id`, `user_id`, `period_type`, `period_start`, `period_end`, `report_payload_json`, `generated_at`

---

## 8. Reporting and PDF Generation

## 8.1 Reporting Pipeline

1. User requests report from frontend.
2. Frontend calls reporting API (`/reports/summary`, `/reports/trends`, `/reports/medication-impact`).
3. Backend aggregates data from persistent storage.
4. Backend optionally enriches with AI insights.
5. Frontend receives normalized report payload.
6. Frontend renders view + exports PDF with `@react-pdf/renderer`.

## 8.2 Supported Report Types

- Daily progress summary
- Weekly mood and productivity report
- Monthly behavior trend report
- Yearly longitudinal report
- Medication impact analysis

## 8.3 PDF Requirements

- Consistent branding (logo, theme-safe colors)
- Clear sectioning (overview, charts/tables, AI notes, recommendations)
- Timestamp and report period
- Optional professional sharing metadata

---

## 9. AI Integration (Gemini)

AI is used as an augmentation layer, not a replacement for stored records.

## 9.1 AI Use Cases

- Dynamic task recommendations from DMS + goals + completion history
- Natural-language summary for report interpretation
- Trend commentary and suggested interventions

## 9.2 Guardrails

- Store source inputs and generated output references for auditability.
- Mark AI-generated sections clearly.
- Never let AI overwrite historical user data directly.

---

## 10. Security, Compliance, and Safety

## 10.1 Authentication and Sessions

- Secure login with password hashing
- Optional OAuth (Google)
- Mandatory 2FA for professionals; configurable for others
- Token/session expiration and refresh strategy

## 10.2 Authorization

- Backend-enforced RBAC on every protected endpoint
- Permission middleware with explicit deny-by-default

## 10.3 Legal and Consent

- Terms acceptance recorded with timestamp/version
- Privacy and data processing disclosures

## 10.4 Moderation and Abuse Handling

- Fraud/abuse report submission
- Evidence tracking and case workflow
- Temporary suspension and permanent ban controls

---

## 11. API Structure (Suggested)

## 11.1 Auth
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/google`
- `POST /auth/2fa/setup`
- `POST /auth/2fa/verify`

## 11.2 Profiles and Settings
- `GET /me`
- `PATCH /me/profile`
- `PATCH /me/preferences`

## 11.3 Client Features
- `POST /goals`, `GET /goals`
- `POST /tasks`, `PATCH /tasks/:id`
- `POST /mood-surveys`, `GET /mood-surveys`
- `POST /medications/logs`, `GET /medications/logs`

## 11.4 Professional Features
- `GET /professionals/search`
- `POST /appointments`
- `GET /professionals/requests`
- `POST /chat/sessions/:id/lock`

## 11.5 Admin and HR
- `GET /admin/verifications`
- `POST /admin/verifications/:id/approve`
- `POST /admin/verifications/:id/reject`
- `GET /admin/complaints`
- `POST /admin/complaints/:id/resolve`

## 11.6 Reports
- `GET /reports/daily`
- `GET /reports/weekly`
- `GET /reports/monthly`
- `GET /reports/yearly`
- `GET /reports/medication-impact`

---

## 12. Frontend Implementation Guidelines (React + Tailwind)

## 12.1 App Structure

- `src/app` for app shell and providers
- `src/features/*` by domain (tasks, surveys, appointments, reports, moderation)
- `src/routes` for role-aware route trees
- `src/components/ui` reusable primitives styled with Tailwind

## 12.2 State and Data

- API-first architecture using service layer
- Role and permission state in auth context/store
- Query caching for report/dashboard data

## 12.3 PDF Layer

- Dedicated `src/reports/pdf/*` templates built with `@react-pdf/renderer`
- Mapping function from API payload -> PDF document props
- One template per report type for maintainability

---

## 13. Non-Functional Requirements

- **Performance:** dashboard responses optimized for low-latency summary views
- **Scalability:** modular services with room for queue-based workloads
- **Observability:** structured logs, audit logs, and error tracing
- **Reliability:** retries for external AI calls and idempotent report jobs
- **Accessibility:** keyboard navigation and screen-reader compatible UI

---

## 14. Recommended Delivery Phases

## Phase 1: Foundation
- Unified auth, RBAC, profile settings, legal consent, 2FA

## Phase 2: Core Client/Professional Flows
- Tasks, DMS, medications, professional search, appointments, chat basics

## Phase 3: Admin/HR Operations
- Verification workflows, complaints, moderation controls, ticket distribution

## Phase 4: Reporting and PDF Export
- Aggregation APIs, report dashboards, PDF templates with React renderer

## Phase 5: AI Enhancements
- Gemini recommendation engine and narrative insights

---

## 15. Final Directive for This Project

MindTrack should be built as **one role-based web platform** (not separate apps), with:

- Frontend: **React.js + Tailwind CSS**
- Server: centralized backend for all persistent data and business logic
- Reporting: server-aggregated data exposed to frontend
- PDF export: frontend rendering via **`@react-pdf/renderer`**

This revised architecture is the authoritative baseline for implementation, replacing the older multi-app split.
