# NWSDB File Tracking & Water Bill Adjustment Management System

## 1. Project Overview

This project is an **internal office-use web application** for the
National Water Supply and Drainage Board (NWSDB). It is intended to help
staff track physical files created for water bill adjustment complaints,
record file handovers and receipts, monitor approval/signature progress,
and help management identify delays.

The system is **not a public consumer portal**. Consumers may visit the
office and make a complaint, but the application is for authorized NWSDB
staff to manage the resulting physical file and its workflow.

The initial focus is **water bill adjustment cases**. The physical file
may need to pass through several responsible officers, and the process
can take weeks or approximately a month. The application should provide
a reliable timeline showing where the file is, who currently has
responsibility for it, when it was handed over, when it was received,
and how long it remained with each person or section.

## 2. Current Project Technology

The planned technology stack is:

-   **Frontend:** React with Vite and JavaScript (JSX)
-   **Routing:** React Router
-   **Backend:** Node.js and Express
-   **Authentication:** Firebase Authentication
-   **Primary database:** Cloud Firestore
-   **Realtime data (where appropriate):** Firebase Realtime Database
-   **Backend Firebase access:** Firebase Admin SDK
-   **Linting:** ESLint

Use the existing Firebase project. Do not add MongoDB unless the project
owner explicitly changes the database decision.

## 3. Business Problem

When a consumer reports an incorrect water bill or another eligible
water-billing issue, the Consumer Relations (CRC --- Consumer Relations)
section receives the complaint and creates a physical file for
investigation and adjustment.

The file may need review, action, or signatures from multiple
responsible staff members. Example roles mentioned so far include:

-   OIC Officer
-   Commercial Officer (CO)
-   Area Engineer (AE)
-   Manager
-   RSC Officer
-   Other authorized office staff

The exact approval sequence and the required signatories may vary by
case type or office procedure. These roles and sequences are **initial
examples, not a finalized workflow**.

Because the file is physical and passes between people or sections,
delays can be difficult to identify. Management, including Head Office,
needs to analyze the time taken at each stage and determine which files
have been delayed and where they are currently held.

## 4. Initial Goals

The first version should aim to:

1.  Register a water bill adjustment case and its physical file.
2.  Give each case/file a unique reference number.
3.  Record the relevant complaint and adjustment-error category.
4.  Track the current location, office/section, and responsible person
    for the file.
5.  Record each handover, including the person handing over the file,
    the intended recipient, and the handover date/time.
6.  Record receipt/arrival date/time when the recipient receives the
    file.
7.  Track required review/signature steps and their status.
8.  Maintain a history of file movements and workflow updates.
9.  Calculate elapsed time between handover and receipt, and time spent
    with each responsible person or section where the available
    timestamps support it.
10. Provide dashboards and reports that help authorized managers and
    Head Office identify delayed files.
11. Record a delay reason or note when staff provide one.
12. Apply role-based access so users can access only the functions and
    information authorized for their role.

## 5. Initial Case Workflow

The following is a high-level example to guide development. Confirm the
actual process with the project owner before enforcing a fixed sequence.

1.  **Complaint received:** A consumer visits the office to report a
    water-billing issue.
2.  **Case/file registered:** CRC staff create a case record and
    register the physical file in the application.
3.  **Error category selected:** Staff choose the relevant
    adjustment-error category and, if applicable, a subcategory.
4.  **File sent for action:** The current holder records a handover to
    the next responsible person or section.
5.  **File received:** The recipient or an authorized staff member
    records the date/time the file was received.
6.  **Review/signature:** Responsible officers complete their review or
    signature step and record its status.
7.  **Further handover:** If another officer or section must act,
    another movement event is recorded.
8.  **Completion:** When all required actions are completed, an
    authorized user records the case/file as completed or closed.
9.  **Monitoring and reporting:** Managers and Head Office review
    current file locations, pending approvals, elapsed times, and
    delays.

A file may be returned for corrections, reassigned, or routed
differently. The design should support recording these events without
deleting the earlier history.

## 6. File Movement and Timestamp Requirements

File movement history is a core feature. Do not implement the system as
only a single editable `currentStatus` field.

Each movement event should be recorded as a separate history item and,
as appropriate, include:

-   Case/file reference
-   From person and/or section
-   To person and/or section
-   Handover date and time
-   Receipt date and time
-   Handover recorded by
-   Receipt recorded by
-   Movement status (for example, handed over, received, returned, or
    cancelled)
-   Optional notes
-   Delay reason, when relevant
-   Creation timestamp and audit metadata

The application should distinguish these events:

-   **Handover time:** When the file was given/sent by the current
    holder.
-   **Receipt time:** When the receiving person/section confirms that
    the physical file arrived.
-   **Time in transit:** The difference between handover and receipt,
    when both timestamps exist.
-   **Time held:** The duration between receipt and the next handover,
    or the current time if the file is still held and not yet handed
    over.
-   **Overall case age:** Time since the case/file was registered, until
    completion or the present time.

Do not assume that the handover date and receipt date are always the
same. Support missing receipt timestamps for files that have been handed
over but not yet confirmed as received. Avoid silently overwriting
historical timestamps. Corrections should be auditable.

Use a consistent storage convention for timestamps (preferably UTC in
the database, rendered in the relevant local timezone in the UI). The
exact office timezone and reporting conventions should be confirmed
before finalizing reports.

## 7. Water Bill Adjustment Error Categories

The business owner has indicated there are approximately **8--9 main
adjustment-error categories**, with some categories containing **4--5
subcategories**. The exact category names and their relationships have
not yet been supplied.

Therefore:

-   Do not invent or hardcode the final list of error types.
-   Design categories and subcategories to be configurable data.
-   Support a main category and an optional subcategory.
-   Allow authorized administrators to maintain the category list if
    approved by the project owner.
-   Keep category IDs stable so historical cases remain meaningful if
    labels are later updated.
-   Confirm whether the category list differs by office, region, or case
    type.

Use placeholder/sample data only for development and clearly label it as
sample data.

## 8. Roles and Access Control

Roles mentioned so far include:

-   CRC / Consumer Relations staff
-   OIC Officer
-   Commercial Officer (CO)
-   Area Engineer (AE)
-   Manager
-   RSC Officer
-   Other office workers/staff
-   Head Office management or reporting users
-   System Administrator

These are provisional role labels. Confirm the final list, role
definitions, office hierarchy, and permissions with the project owner.

The role-based access design should support:

-   Creating and registering a case/file
-   Viewing permitted files
-   Recording handovers and receipts
-   Completing assigned review/signature steps
-   Viewing file movement history
-   Reviewing overdue or delayed files
-   Viewing reports at an appropriate organizational level
-   Managing users and reference data, where authorized

Do not assume every user can view or modify every file. Permissions may
depend on role, assignment, section, office, region, or management
level. Keep authentication separate from authorization: being signed in
does not automatically grant permission to perform an action.

Enforce authorization in the Express backend for protected APIs. Use
Firebase Security Rules for client-side Firebase access. Remember that
Firebase Admin SDK operations bypass Firestore and Realtime Database
Security Rules, so server-side authorization checks are essential.

## 9. Reporting and Delay Analysis

A future management dashboard should be able to show, according to the
viewer's permissions:

-   Total open and completed cases
-   Files currently held by each person or section
-   Files awaiting receipt confirmation
-   Files awaiting review/signature
-   Files that have exceeded a configurable time threshold
-   Overall case age
-   Time spent at each workflow step or with each holder
-   Handover-to-receipt duration
-   Delays grouped by office, section, role, or responsible person,
    where authorized
-   Recorded reasons for delays
-   A detailed movement timeline for an individual file

Do not label a person or section as responsible for a delay based only
on the total case duration. Calculate stage-level durations from
recorded events and make missing timestamps visible. Reporting
thresholds and business rules should be configurable or confirmed with
the owner.

## 10. Suggested Initial Data Concepts

These are conceptual entities, not a finalized database schema:

-   **User:** Authentication UID, display name, role assignments,
    office/section assignment, active status.
-   **Office/Section:** Organizational unit and, if needed, parent
    office/region.
-   **Case/File:** Unique reference, complaint details, registration
    date, adjustment category, current holder/location, current workflow
    status, completion details.
-   **Error Category:** Main category, subcategory relationship, active
    status.
-   **Workflow Step / Required Signatory:** The expected action,
    assigned role/person, sequence or order if applicable, and current
    status.
-   **Movement Event:** Handover and receipt details, from/to person or
    section, timestamps, notes, and audit information.
-   **Approval/Signature Record:** Assigned reviewer, status, action
    timestamp, and comments or return reason if applicable.
-   **Audit Event:** Important changes and the authenticated user who
    made them.

The exact schema and choice between Firestore and Realtime Database for
individual data types should be decided during architecture design.
Firestore is the likely primary store for case records, movement
history, approvals, and reporting queries. Realtime Database should be
used only where its live synchronization behavior adds value; avoid
maintaining conflicting copies of the same authoritative data without a
clear synchronization plan.

## 11. Recommended Repository Structure

Keep the frontend and backend separate. Organize code by feature so the
system can expand as requirements are clarified.

``` text
NWSDB/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── routes/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── files/
│   │   │   ├── movements/
│   │   │   ├── approvals/
│   │   │   ├── users/
│   │   │   ├── departments/
│   │   │   └── error-categories/
│   │   ├── services/
│   │   ├── firebase/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── services/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── files/
│   │   │   ├── movements/
│   │   │   ├── approvals/
│   │   │   ├── users/
│   │   │   ├── departments/
│   │   │   └── error-categories/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

Create feature files only when implementing the feature. Do not generate
a large number of empty files or build every module in the first step.

## 12. Development Phases

### Phase 1 --- Project foundation

-   Confirm that the React frontend and Express backend run.
-   Configure Firebase client SDK and Firebase Admin SDK securely.
-   Set up environment variable examples and Git exclusions.
-   Establish consistent error handling and basic logging.
-   Add a minimal health-check endpoint.

### Phase 2 --- Authentication and authorization

-   Connect Firebase Authentication.
-   Verify Firebase ID tokens on protected Express endpoints.
-   Define initial roles and permission checks.
-   Protect frontend routes for usability, while treating backend checks
    as authoritative.
-   Confirm how administrators create, assign, disable, and update staff
    accounts.

### Phase 3 --- File registration

-   Define the file reference format and required case fields.
-   Create the first file-registration form and file details view.
-   Store configurable adjustment-error categories and subcategories.
-   Add input validation.

### Phase 4 --- Movement tracking

-   Record handover and receipt events.
-   Show current holder/location and chronological movement history.
-   Calculate time in transit and time held.
-   Preserve audit history and handle missing timestamps.

### Phase 5 --- Approval/signature workflow

-   Confirm the real approval path and required signatories.
-   Track pending, completed, returned, and other approved workflow
    states.
-   Support case-specific routing if different adjustment categories
    require different signatories.

### Phase 6 --- Dashboards and reports

-   Show pending work and current file locations.
-   Calculate stage-level and overall elapsed times.
-   Add overdue views and delay reasons.
-   Apply reporting permissions for managers and Head Office.

### Phase 7 --- Testing and rollout

-   Test permissions for every role.
-   Test handover, receipt, return, reassignment, and completion
    scenarios.
-   Verify timestamp calculations and reporting.
-   Test invalid access attempts and sensitive data exposure.
-   Prepare deployment and backup/recovery procedures.

## 13. Security and Data Integrity Requirements

-   Never place Firebase Admin service-account credentials in the React
    app or commit them to source control.
-   Keep secrets in environment configuration and exclude real `.env`
    files and service-account JSON files from Git.
-   Use Firebase Authentication for staff identity.
-   Verify ID tokens and enforce permissions on the backend.
-   Validate all request data on the server.
-   Use least-privilege access for staff and administrative roles.
-   Record important changes, especially file movement, receipt
    confirmation, approval actions, and corrections.
-   Avoid deleting movement or approval history during ordinary edits.
-   Use atomic writes or transactions where needed to keep current file
    location and movement history consistent.
-   Configure Firestore and Realtime Database Security Rules for direct
    client access.
-   Do not treat frontend route protection as a security boundary.
-   Do not expose consumer details to staff who do not need them for
    their duties.

## 14. Initial Scope Boundaries

For the first development stage:

-   Build the project foundation, not the entire business application.
-   Do not create a public consumer login or consumer portal.
-   Do not invent the final adjustment-error categories.
-   Do not hardcode an unconfirmed approval sequence.
-   Do not assume every case needs the same number of signatures.
-   Do not add unrelated modules unless requested.
-   Do not replace Firebase with MongoDB without approval.
-   Do not use mock/sample records as if they were real NWSDB records.

## 15. Open Questions to Confirm Later

The owner will provide details progressively. Before implementing the
relevant functionality, confirm:

1.  The exact list of main adjustment-error categories and
    subcategories.
2.  The final roles and the permissions of each role.
3.  The organizational hierarchy (office, section, area, region, Head
    Office).
4.  The required signatories and whether approval order varies by case
    type.
5.  Whether staff can hand over a file to any officer or only the next
    expected officer.
6.  Who is allowed to confirm receipt and correct an incorrect
    timestamp.
7.  Whether a physical file can have multiple simultaneous assignments
    (assume one current custodian until clarified).
8.  The rules for returns, reassignment, cancellation, and reopening.
9.  The expected delay thresholds and reporting formats.
10. Whether attachments, scanned documents, or electronic signatures are
    required. The initial purpose is tracking a physical file and its
    signatures; do not assume the system replaces physical signatures.

## 16. Instructions for the Code Agent

When using this README as project context:

1.  Read the existing repository before changing anything.
2.  Preserve the current JavaScript/JSX setup and installed dependencies
    where possible.
3.  Do not overwrite existing files or replace working configuration
    without checking it first.
4.  Implement in small, reviewable stages.
5.  Begin with the project foundation and verify that frontend and
    backend start successfully.
6.  Keep frontend code in `client/` and backend code in `server/`.
7.  Use Firebase Authentication, Cloud Firestore, and Realtime Database
    as described above; use Firebase Admin SDK only on the backend.
8.  Keep secrets out of source control and provide `.env.example` files
    with placeholders only.
9.  Do not invent business rules, categories, approval sequences, roles,
    or permissions that have not been confirmed.
10. Before implementing a business feature, state the proposed files,
    data model, API endpoints, and permission checks, then implement and
    test that feature.
11. Report which files were created or changed, which commands were run,
    and any remaining setup steps.
12. Do not claim a feature is complete unless it has been implemented
    and verified.

**Immediate task:** Inspect the current repository and complete or
verify the basic React + Vite frontend and Express backend setup. Add
only the minimum configuration needed to run both applications. Do not
implement file tracking, approval workflows, dashboards, or business
data models until the owner requests the next step.
