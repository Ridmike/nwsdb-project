# NWSDB File Tracking & Water Bill Adjustment Management System

Internal staff web application for the National Water Supply and Drainage Board (NWSDB). The system tracks physical files created for water bill adjustment complaints, records handovers and receipts, monitors approval/signature progress, and helps managers identify delays.

This is **not** a public consumer portal. Only authorised NWSDB staff use the application.

---

## 1. System Analysis

### 1.1 Business problem

When a consumer reports an incorrect water bill, Consumer Relations (CRC) creates a physical file. That file may pass through OIC, Commercial, Engineering, Manager, RSC, and Head Office staff for review, correction, and signature. Because the file is physical, it is difficult to know:

- who currently holds the file,
- which section or office it is in,
- when it was handed over and received,
- how long each stage is taking,
- which files are delayed and why.

The application provides a single, auditable record of the file lifecycle and the time spent at each stage.

### 1.2 Goals

1. Register a water bill adjustment case and its physical file.
2. Assign a unique file reference number.
3. Record the complaint and adjustment-error category/subcategory.
4. Track the current holder, section, and office.
5. Record handovers with date/time and intended recipient.
6. Record receipt confirmation separately from handover.
7. Track review/signature steps and their status.
8. Preserve a chronological movement and approval history.
9. Calculate time in transit, time held, and overall case age.
10. Provide dashboard and reporting views for delays.
11. Enforce role-based access on the server.
12. Maintain an audit trail for important actions.

### 1.3 Scope of this implementation

Implemented in this repository:

- Firebase Authentication login with username/email support.
- Express API with Firebase ID-token verification and role checks.
- Staff user administration (create, update role/status, password reset link).
- Department/office reference data.
- Configurable main and sub error categories.
- Case/file registration, search, filtering, and detail view.
- Movement tracking: handover, receipt confirmation, return/reassignment.
- File timeline with time-in-transit and time-held calculations.
- Approval/signature steps with approve/return actions.
- Dashboard summary, overdue files, pending receipts, pending approvals.
- Reports for status, category, holder, and delay analysis.
- Local demo mode with sample data for UI testing without Firebase.
- Responsive NWSDB design system.

Not finalised yet (requires business confirmation):

- The exact real adjustment-error category list.
- The mandatory approval sequence per case type.
- Office/region hierarchy rules.
- Attachment/scan storage and electronic signatures.
- Automated notifications (email/SMS).

The application keeps categories and approval steps configurable so these can be confirmed later without code changes to the data model.

---

## 2. Architecture

```text
React + Vite client (JavaScript/JSX)
        |
        | HTTPS + Firebase ID token (Authorization: Bearer <token>)
        v
Express API (Node.js)
        |
        | Firebase Admin SDK (server-side only)
        v
Firebase Authentication + Cloud Firestore
```

### 2.1 Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 7, JavaScript/JSX |
| Styling | Custom NWSDB design system (CSS variables and components) |
| Backend | Node.js, Express 5 (CommonJS) |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| Server SDK | Firebase Admin SDK 14 (modular API) |
| Linting | ESLint |

Firestore is the primary data store. Firebase Realtime Database is not required for the current feature set; add it only if live synchronisation is confirmed.

### 2.2 Repository layout

```text
nwsdb-project/
├── nwsdb-client/
│   └── src/
│       ├── components/        Shared NWSDB UI components
│       ├── context/           Authentication context
│       ├── demo/              Local demo data store (browser only)
│       ├── features/          Workflow modals grouped by domain
│       │   ├── approvals/
│       │   ├── files/
│       │   ├── reference/
│       │   └── users/
│       ├── firebase/          Firebase client initialization
│       ├── hooks/
│       ├── layouts/
│       ├── pages/             Route-level screens
│       ├── routes/            Protected and role-based routing
│       ├── services/          API and demo service adapters
│       └── utils/
├── nwsdb-server/
│   └── src/
│       ├── config/            Firebase Admin initialization
│       ├── middleware/        Auth and role checks
│       ├── modules/
│       │   ├── users/
│       │   ├── departments/
│       │   ├── categories/    Error categories and subcategories
│       │   ├── files/         File, movement, and approval workflows
│       │   ├── approvals/
│       │   ├── dashboard/
│       │   └── reports/
│       ├── routes/
│       ├── scripts/           Admin bootstrap
│       └── utils/             Shared HTTP, audit, and data helpers
└── README.md
```

---

## 3. Roles and Permissions

Initial roles (provisional, configurable):

| Role | Code | Main responsibilities |
| --- | --- | --- |
| System Administrator | `admin` | Users, roles, reference data, all files |
| CRC / Consumer Relations | `crc` | Register cases/files, record handovers and receipts |
| OIC Officer | `oic` | Review files, approve/sign, record movements |
| Commercial Officer | `co` | Review billing corrections, approve/sign |
| Area Engineer | `ae` | Engineering review/signature |
| Manager | `manager` | Management review, reports, delays |
| RSC Officer | `rsc` | Regional support review/signature |
| Office Staff | `staff` | View permitted files, record movements |

Permission rules:

- All authenticated staff can view files permitted by their role/assignment.
- `admin` and `crc` can register new files.
- Any authenticated staff member who currently holds a file can record a handover.
- The intended recipient (or an authorised staff member) confirms receipt.
- Approval actions are limited to the assigned role/user or `admin`.
- `admin` manages users and reference data.
- `manager`, `rsc`, and `admin` can view organisation-wide reports.
- Backend checks are authoritative; frontend route guards are only for usability.
- An administrator cannot remove their own admin role or disable their own account.

---

## 4. Data Model (Firestore)

Timestamps are stored as ISO 8601 strings and rendered in the office's local timezone. This keeps demo-mode data and Firestore-backed data in the same shape.

### 4.1 `users`

| Field | Type | Notes |
| --- | --- | --- |
| `uid` | string | Firebase Auth UID (document ID) |
| `email` | string | Login email |
| `username` | string | Optional short username |
| `displayName` | string | Full name |
| `role` | string | Role code |
| `section` | string | Section/division name |
| `office` | string | Office/region name |
| `active` | boolean | Disabled accounts cannot sign in |
| `createdAt`, `updatedAt` | timestamp | Audit metadata |

Role, active state, section, and office are mirrored into Firebase custom claims for fast authorisation. Firestore keeps the profile record.

### 4.2 `departments`

`id`, `name`, `code`, `type` (`office`, `section`, `division`), `parentId`, `active`, `createdAt`.

### 4.3 `errorCategories`

`id`, `name`, `code`, `parentId` (null for a main category), `active`, `createdAt`.

Main categories and subcategories are configurable data, not hardcoded. Historical files keep stable category IDs.

### 4.4 `files`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Document ID |
| `reference` | string | Unique reference, e.g. `WBA/2026/0007` |
| `complaintNo` | string | Office complaint number |
| `consumerName` | string | Consumer name |
| `consumerAddress` | string | Address |
| `consumerPhone` | string | Phone |
| `billMonth` | string | Billing month (YYYY-MM) |
| `billAmount` | number | Original bill amount |
| `adjustmentAmount` | number | Proposed adjustment |
| `categoryId` | string | Main category |
| `subCategoryId` | string | Optional subcategory |
| `description` | string | Complaint summary |
| `priority` | string | `normal` or `urgent` |
| `status` | string | `open`, `pending_receipt`, `pending_approval`, `completed`, `cancelled` |
| `currentHolderUid` | string | Current custodian |
| `currentHolderName` | string | Denormalised display name |
| `currentDepartmentId` | string | Current section/office |
| `registeredByUid`, `registeredByName` | string | Creator |
| `registeredAt` | timestamp | Registration date |
| `dueDate` | timestamp | Delay threshold reference |
| `lastMovementAt` | timestamp | Latest handover/receipt |
| `pendingMovementId` | string | Handover awaiting receipt |
| `completedAt` | timestamp | Completion date |
| `createdAt`, `updatedAt` | timestamp | Audit metadata |

### 4.5 `files/{fileId}/movements`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Movement ID |
| `fileId` | string | Parent file |
| `type` | string | `handover`, `return`, `reassignment` |
| `fromUid`, `fromName`, `fromDepartmentId` | string | Sender |
| `toUid`, `toName`, `toDepartmentId` | string | Recipient |
| `handoverAt` | timestamp | When handed over |
| `handoverByUid` | string | Who recorded handover |
| `receiptAt` | timestamp | When receipt confirmed (may be null) |
| `receiptByUid` | string | Who confirmed receipt |
| `status` | string | `handed_over`, `received`, `returned`, `cancelled` |
| `notes` | string | Optional notes |
| `delayReason` | string | Optional reason |
| `createdAt` | timestamp | Audit metadata |

Handover and receipt are separate events. Do not assume they happen at the same time. Missing receipt timestamps are valid and visible in the UI.

### 4.6 `files/{fileId}/approvals`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Approval step ID |
| `fileId` | string | Parent file |
| `title` | string | e.g. "Commercial Officer review" |
| `assignedRole` | string | Role expected to act |
| `assignedUid` | string | Optional specific assignee |
| `sequence` | number | Display/expected order |
| `status` | string | `pending`, `approved`, `returned`, `skipped` |
| `actionAt` | timestamp | Action date |
| `actionByUid`, `actionByName` | string | Actor |
| `comment` | string | Approval/return comment |
| `createdAt` | timestamp | Audit metadata |

### 4.7 `auditEvents`

`id`, `actorUid`, `actorName`, `action`, `entityType`, `entityId`, `details`, `createdAt`.

Important actions are appended to the audit log; movement and approval history is never deleted during ordinary edits.

---

## 5. File Movement and Time Calculations

The application records each movement as a separate history item.

- **Handover time**: when the current holder gives/sends the file.
- **Receipt time**: when the recipient confirms the physical file arrived.
- **Time in transit**: receipt time minus handover time (only when both exist).
- **Time held**: receipt time to the next handover, or now if the file is still held.
- **Overall case age**: registration time to completion/now.

Rules:

- A handover sets the file to `pending_receipt` and stores `pendingMovementId`.
- The recipient confirms receipt, which updates the actual current holder.
- Returns and reassignments are new movement events; earlier history is retained.
- Timestamps are never silently overwritten.
- Corrections should be auditable (use notes/audit events).
- A file awaiting receipt is shown separately from a file being actively held.

---

## 6. Workflow

1. CRC registers the complaint and physical file.
2. The error category/subcategory is selected.
3. The current holder records a handover to the next officer/section.
4. The recipient confirms receipt.
5. Required approval/signature steps are created and acted on.
6. Further handovers are recorded as needed.
7. An authorised user completes/closes the file.
8. Managers review current locations, pending work, elapsed time, and delays.

A file may be returned for correction and routed again. The history must remain intact.

---

## 7. API Reference

Base URL: `http://localhost:5000/api`

All routes except `/health` and the login flow require a Firebase ID token:

```http
Authorization: Bearer <firebase-id-token>
```

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Server health |
| GET | `/users` | Admin | List staff |
| GET | `/users/directory` | Authenticated | Minimal active-staff list for handover recipients |
| POST | `/users` | Admin | Create staff account |
| PATCH | `/users/:uid` | Admin | Update name/role/section/office/active |
| POST | `/users/:uid/reset-password` | Admin | Generate password reset link |
| GET | `/departments` | Authenticated | List departments |
| POST | `/departments` | Admin | Create department |
| PATCH | `/departments/:id` | Admin | Update department |
| GET | `/error-categories` | Authenticated | List categories/subcategories |
| POST | `/error-categories` | Admin | Create category |
| PATCH | `/error-categories/:id` | Admin | Update category |
| GET | `/files` | Authenticated | List/search/filter files |
| POST | `/files` | Admin, CRC | Register a file |
| GET | `/files/:id` | Authenticated | File detail |
| PATCH | `/files/:id` | Admin, CRC | Update file details |
| POST | `/files/:id/complete` | Admin, Manager | Complete/close |
| GET | `/files/:id/movements` | Authenticated | Movement history |
| POST | `/files/:id/movements` | Authenticated | Record handover/return |
| POST | `/files/:id/movements/:movementId/receive` | Authenticated | Confirm receipt |
| GET | `/files/:id/approvals` | Authenticated | Approval steps |
| POST | `/files/:id/approvals` | Admin, CRC, Manager | Add approval step |
| PATCH | `/files/:id/approvals/:approvalId` | Assigned role/admin | Approve or return |
| GET | `/approvals` | Authenticated | Approvals for the current role/user |
| GET | `/dashboard/summary` | Authenticated | Dashboard counts and lists |
| GET | `/reports/summary` | Manager, RSC, Admin | Delay/report analysis |

Most responses use:

```json
{ "success": true, "data": ... }
```

The user-administration endpoints return `{ "success": true, "users": ... }` because the client consumes that shape directly. Errors use:

```json
{ "success": false, "message": "Human readable message" }
```

---

## 8. Security

- Firebase Admin service-account credentials exist only on the server.
- Never commit `.env` files, service-account JSON, or private keys.
- The client sends Firebase ID tokens; the server verifies every protected request.
- Role checks are enforced in Express middleware and module services.
- Firestore Security Rules must deny direct client writes for business collections unless a specific requirement is confirmed. Server-side Admin SDK access bypasses rules, so server authorisation is mandatory.
- Validate input on the server.
- Use least-privilege access for staff and administrators.
- Record audit events for file registration, movement, receipt, approvals, completion, and user administration.
- Do not expose consumer data to staff who do not need it.
- Frontend route protection is not a security boundary.

---

## 9. Local Setup

### 9.1 Prerequisites

- Node.js 22 or newer (Firebase Admin 14 requirement)
- npm
- A Firebase project (for real mode)
- Firebase Authentication with Email/Password enabled
- Cloud Firestore enabled

### 9.2 Client

```bash
cd nwsdb-client
npm install
copy .env.example .env
npm run dev
```

`.env` values:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_BASE_URL=http://localhost:5000/api
VITE_LOGIN_EMAIL_DOMAIN=nwsdb.lk
```

`VITE_LOGIN_EMAIL_DOMAIN` is appended to a username that does not contain `@` (for example `admin` becomes `admin@nwsdb.lk`). Full email addresses still work.

### 9.3 Server

```bash
cd nwsdb-server
npm install
copy .env.example .env
npm run dev
```

Server `.env` values (choose one credential method):

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
# or
FIREBASE_SERVICE_ACCOUNT_JSON=
# or
GOOGLE_APPLICATION_CREDENTIALS=
```

### 9.4 First administrator

1. Create the first staff user in Firebase Authentication (email/password).
2. Run:

```bash
cd nwsdb-server
npm run set-admin -- user@nwsdb.lk
```

3. Sign out and sign in again so the new custom claims are loaded.
4. Use the admin account to create other users and assign roles.

---

## 10. Demo Mode

To preview the full interface without Firebase:

- Leave `nwsdb-client/.env` without Firebase values.
- Run `npm run dev`.
- The login page prefills:
  - Username: `admin`
  - Password: `demo1234`

Demo mode is enabled only in development when Firebase is not configured. It uses browser `localStorage`/`sessionStorage` sample data, clearly labelled as demo data. Demo data is not written to Firestore and must not be treated as real NWSDB records.

Use the demo role switcher in the app header to preview CRC, OIC, CO, AE, Manager, RSC, and staff views.

Reset demo data from the user menu if needed.

For real Firebase mode, add the client and server credentials. The login page then uses Firebase Authentication and the full API.

---

## 11. Current Implementation Status

| Area | Status |
| --- | --- |
| React/Vite foundation and design system | Done |
| Login (username/password, demo mode, password reset) | Done |
| Firebase client and server configuration | Done |
| Express health check and error handling | Done |
| Firebase token verification and role middleware | Done |
| Staff user administration API and UI | Done |
| Department reference data | Done |
| Error category/subcategory reference data | Done |
| File registration and file list/detail | Done |
| Movement handover/receipt and timeline | Done |
| Approval/signature steps | Done |
| Dashboard | Done |
| Reports and delay analysis | Done |
| Audit event records | Done |
| Demo data mode | Done |
| Automated test suite | Planned |
| Attachments/scanned documents | Planned |
| Notifications | Planned |
| Production deployment and backups | Planned |

The implementation is a working MVP. Real category lists, mandatory approval paths, and organisational hierarchy rules still require confirmation from the project owner before they are enforced.

---

## 12. Commands

Client:

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

Server:

```bash
npm run dev
npm run start
npm run set-admin -- user@nwsdb.lk
```

---

## 13. Open Questions

1. Exact main and sub adjustment-error categories.
2. Final role names and permissions.
3. Office/section/region hierarchy.
4. Required signatories and whether the order varies by case type.
5. Whether staff may hand over to any officer or only the expected next officer.
6. Who may confirm receipt and correct timestamps.
7. Rules for returns, reassignment, cancellation, and reopening.
8. Delay thresholds and report formats.
9. Whether scanned attachments or electronic signatures are required.
10. Deployment target, backup schedule, and retention policy.
