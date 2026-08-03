# Radaba Feature Status

## Completed milestones

### Phase 4: Firebase authentication

- Client Firebase sign-in and ID-token exchange
- Firebase Admin session-cookie creation and revocation-aware verification
- Existing RTDB user, status, and privilege contract preservation
- Protected routes, logout, password reset, and authentication regressions

### Phase 5: Authenticated application shell

| Capability                                 | Status                                 | Notes                                                   |
| ------------------------------------------ | -------------------------------------- | ------------------------------------------------------- |
| Server-protected `/home` layout            | Completed                              | Resolves the session once and passes a safe user view   |
| Desktop sidebar                            | Completed                              | Expanded, collapsed, active route, accessible labels    |
| Mobile navigation                          | Completed                              | Overlay, Escape, scroll lock, close after navigation    |
| Application header                         | Completed                              | Breadcrumb, identity, role, user menu, logout           |
| Central navigation                         | Completed                              | Assignment, Profile, Settings                           |
| Page-header pattern                        | Completed                              | Used by all Phase 5 pages                               |
| Assignment placeholder                     | Completed                              | No assignment records fetched                           |
| Profile placeholder                        | Completed                              | Read-only safe legacy user fields                       |
| Settings placeholder                       | Completed                              | No settings persistence or writes                       |
| Privilege route filtering                  | Deferred pending contract verification | Approved routes remain visible; no permissions invented |
| Responsive/accessibility manual validation | Manual validation required             | Desktop, mobile, keyboard, and browser checks           |

Assignment data migration, profile editing, settings persistence, Redux, and operational modules remain outside Phase 5.

### Phase 7A: Assignment contract confirmation

| Capability                          | Status    | Notes                                                          |
| ----------------------------------- | --------- | -------------------------------------------------------------- |
| Raw and normalized Assignment types | Completed | Legacy names and scalar variations preserved                   |
| Pure list mapper                    | Completed | No duration anomaly applied                                    |
| Date and active-filter mappings     | Completed | Jakarta server contract; exact composites                      |
| Read-only repository scaffold       | Completed | Lookup/list only; no writes                                    |
| Assignment privilege rule           | Completed | Exact `/assignment` path and role boolean                      |
| Sanitized fixtures and tests        | Completed | No production Firebase connection                              |
| Assignment table UI                 | Deferred  | Phase 7B                                                       |
| Production evidence                 | Required  | Indexes, records, volumes, deployed behavior, privilege record |

### Phase 7C: Assignment search and CSV export

| Capability            | Status    | Notes                                                              |
| --------------------- | --------- | ------------------------------------------------------------------ |
| Assignment ID search  | Completed | Exact `assignment_id` equality                                     |
| Tower ID search       | Completed | Created/closed date composites; deployed indexes need confirmation |
| Filter UX             | Completed | Canonical URL state, summary, clear/reset, validation              |
| CSV export            | Completed | Authenticated, privileged, 5,000-row maximum                       |
| Duration              | Omitted   | Legacy 39-minute and CSV meanings remain unresolved                |
| Production validation | Required  | Indexes, representative CSV, Excel, volume behavior                |

### Phase 6A: Administrator role and privilege management

| Capability                    | Status         | Notes                                         |
| ----------------------------- | -------------- | --------------------------------------------- |
| Privilege resolver correction | Completed      | Reads confirmed push-key collection           |
| Administrator authorization   | Completed      | Active `super_admin` plus strict `/privilege` |
| Users management              | Completed      | Role/status only; UID/email read-only         |
| Roles inventory               | Completed      | Derived from users and boolean fields         |
| Privilege matrix              | Completed      | Existing strict booleans only                 |
| Final-admin protection        | Completed      | Immediate pre-write checks; race documented   |
| RTDB audit                    | Completed      | Generic append-only infrastructure; role/status integrated |

### Administrator Audit Infrastructure

| Capability | Status | Notes |
| --- | --- | --- |
| Generic audit contract | Completed | Reusable action/resource snapshots and request context |
| Append-only RTDB storage | Completed | Generated key under `administrator_audit` |
| Safe snapshot filtering | Completed | Recursive sensitive-key removal and bounds |
| User role/status integration | Completed | Post-write best-effort append only |
| Other administrator modules | Deferred | No News, Gallery, or Touring implementation is present |

- Phase 7E bulk Assignment import: implemented and automatically validated; non-production manual Firebase verification remains outstanding.

### Users List Enterprise Enhancement

| Capability | Status | Notes |
| --- | --- | --- |
| Search and exact filters | Completed | URL-driven; existing RTDB fields only |
| Deterministic sorting | Completed | Explicit field ordering with push-key tie-breaker |
| Server page slicing | Completed | 25, 50, or 100 rows; one user and one privilege collection read |
| Responsive results | Completed | Existing desktop table and mobile cards preserved |
| Firebase cursor pagination | Deferred | Requires a separately approved query/index strategy |
| Role mismatch | Known limitation | No normalization or role/privilege redesign |

### User Detail and Account History Ã¢â‚¬â€ Phase A

| Capability | Status | Notes |
| --- | --- | --- |
| Push-key detail route | Completed | Direct `user/{pushKey}` read; active administrator only |
| Application and legacy profile | Completed | Display-safe fields with integrity warnings |
| Effective privileges | Completed | Existing strict boolean role mapping only |
| Account history | Unavailable | No persistent role, status, or administrator audit history |
| Firebase Auth metadata | Completed | Optional bounded read; four explicit availability states |

### Assignment page UI/UX redesign

| Capability                     | Status    | Notes                                                                                                               |
| ------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------- |
| Compact action hierarchy       | Completed | Create Assignment is primary; Export CSV is secondary; refresh, import, and template remain available               |
| Unified search/filter workflow | Completed | Search and filter surfaces are visually joined while preserving debounced search and explicit filter Apply behavior |
| Applied criteria               | Completed | Human-readable dates, valid Unicode separators, removable search/category chips, and Clear all                      |
| Responsive results             | Completed | Sticky desktop table and complete mobile cards preserve all list information                                        |
| Operational states             | Completed | Filter-aware empty state, pending feedback, export errors, and truthful page-range pagination                       |
| Manual browser validation      | Required  | Confirm desktop, tablet, mobile, keyboard, and representative production-scale result behavior                      |

### Assignment Detail dashboard

| Capability                            | Status          | Notes                                                                                               |
| ------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------- |
| Dynamic push-key detail route         | Completed       | Server authenticated, exact Assignment privilege, missing records return not found                  |
| Typed legacy detail mapping           | Completed       | Confirmed existing fields only; no schema changes or invented values                                |
| Responsive operations dashboard       | Completed       | Summary cards, grouped definitions, lifecycle timeline, sticky overview sidebar                     |
| Supported record actions              | Completed       | Refresh, print, report link when present, and existing rigger reassignment                          |
| Detail loading and empty states       | Completed       | Route-specific skeleton and contextual lifecycle/report states                                      |
| Comments, attachments, activity audit | Not implemented | No confirmed data or API contract exists                                                            |
| Manual browser validation             | Required        | Validate representative records, print output, breakpoints, keyboard flow, and external report URLs |

### Completed Assignment rigger immutability

| Capability                      | Status         | Notes                                                                                             |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| Shared UI lock                  | Completed      | Completed records display Rigger Locked with a visible explanation across list and detail views   |
| Server command guard            | Completed      | Direct PATCH requests receive HTTP 409 `ASSIGNMENT_COMPLETED` before rigger resolution            |
| Atomic final guard              | Completed      | RTDB transaction rechecks the latest record and aborts without mutation when completed            |
| Legacy completion compatibility | Completed      | Recognizes Completed status/state, legacy Finished state, completed flag, and completed timestamp |
| Audit record                    | Not introduced | No existing Assignment audit data contract exists                                                 |

### Revisit Assignment

| Capability                         | Status         | Notes                                                                                                            |
| ---------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| Completed-only action              | Completed      | Detail page shows Revisit Assignment only for a completed record and requires confirmation plus a reason         |
| Existing-record reopen             | Completed      | Same push key and Assignment ID; workflow returns to `On Progress` / `Open` without duplication                  |
| Atomic server validation           | Completed      | Transaction rejects non-completed or concurrently reopened records with HTTP 409                                 |
| Revisit metadata and history       | Completed      | Count, latest revisit metadata, and append-only record-local events drive the badge, timeline, and activity log  |
| Existing data preservation         | Completed      | Completion timestamps, people, descriptions, comments, attachments, photos, and other fields are not removed     |
| Notifications                      | Not introduced | No confirmed Assignment notification infrastructure exists                                                       |
| Manual Firebase/browser validation | Required       | Verify one production-shaped completed record, a repeated revisit cycle, and authorized/unauthorized UI behavior |

### Completed Rigger lock refinement

| Capability                    | Status    | Notes                                                                                              |
| ----------------------------- | --------- | -------------------------------------------------------------------------------------------------- |
| Actual-change comparison      | Completed | Normalized persisted email is primary; legacy name fallback applies only when email is absent      |
| Same-Rigger no-op             | Completed | A completed Assignment may resubmit the same trusted Rigger without a conflict or database rewrite |
| Changed or cleared Rigger     | Completed | Completed records reject actual changes; empty API input remains invalid                           |
| Latest-record race protection | Completed | One RTDB transaction repeats identity and completion checks before rebuilding Rigger composites    |
| Non-Rigger and bulk behavior  | Unchanged | No general edit or bulk reassignment endpoint exists; bulk import creates new records only         |

### Assignment Timeline and Activity History

| Capability                  | Status         | Notes                                                                                                                        |
| --------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Chronological lifecycle     | Completed      | Builds one ordered timeline from confirmed Assignment timestamps and revisit history                                         |
| Event cards                 | Completed      | Typed event titles, descriptions, actors, timestamps, icons, colors, and optional metadata                                   |
| Revisit integration         | Completed      | Previous completion and every revisit reason/status transition appear without duplicate activity rendering                   |
| Empty and responsive states | Completed      | Semantic ordered list, full-width mobile cards, connector, and contextual empty state                                        |
| Permission and performance  | Unchanged      | Existing server authorization and one `assignment/{pushKey}` read; no additional query                                       |
| New audit storage           | Not introduced | No compatible general audit contract exists; unsupported comments, attachments, progress, and update events are not invented |

### Assignment Progress Workflow

| Capability                      | Status    | Notes                                                                                                        |
| ------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| Canonical legacy state contract | Completed | Centralizes the seven confirmed `assignment_state` values without adding aliases                             |
| Accept Assignment               | Completed | `Open` ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ `Accepted` with existing accepted date/datetime fields                                              |
| Start Work                      | Completed | `Accepted` ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ `On Progress` with existing check-in date/datetime fields                                       |
| Pause Work                      | Completed | `On Progress` ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ `Paused` with existing paused date/datetime fields                                           |
| Atomic validation               | Completed | Latest persisted state is rechecked in one RTDB transaction; invalid transitions return HTTP 409             |
| Timeline integration            | Completed | Existing timeline automatically consumes accepted, check-in, and paused timestamps                           |
| Additional workflow stages      | Deferred  | Reject, drop, close, travelling, arrival, waiting, and testing require confirmed contracts                  |

### Assignment Workflow: Resume and Complete

| Capability               | Status               | Notes                                                                                             |
| ------------------------ | -------------------- | ------------------------------------------------------------------------------------------------- |
| Resume Work              | Completed            | `Paused` ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ `On Progress`; original check-in and pause timestamps remain unchanged                 |
| Resume timeline          | Deliberately omitted | No confirmed resume timestamp exists, so no event is inferred                                     |
| Complete Assignment      | Completed            | `On Progress` ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ canonical `Finished` / `Completed` with server Jakarta timestamp                  |
| Completion actor         | Completed            | Optional `completed_by_uid` and `completed_by_name` are derived from the authenticated session    |
| Completion prerequisites | None confirmed       | No new evidence, photo, checklist, note, or ownership requirement was introduced                  |
| Rigger lock and Revisit  | Preserved            | Completion activates the existing lock; Revisit reopens the same Assignment and preserves history |
| Concurrency              | Completed            | Latest state is checked inside one RTDB transaction; duplicate requests cannot both commit        |

## Phase 7I Assignment Photo Evidence

| Capability | Status | Notes |
| --- | --- | --- |
| Evidence categories | Completed | Before, During, and After Work use canonical `before`, `during`, and `after` values |
| Secure upload | Completed | Authenticated server API validates MIME, signature, size, Assignment state, and quota |
| Metadata | Completed | Separate `assignment_photo/{assignmentPushKey}/{photoId}` RTDB node |
| Storage | Completed | Collision-safe Assignment/category/photo paths; direct client access denied |
| Gallery and viewer | Completed | Responsive lazy grid, progress/error states, keyboard viewer, download and approved delete |
| Completed/Revisit behavior | Completed | Completed is read-only; Revisit preserves evidence and restores active uploads |
| Timeline and image_total | Preserved | No photo event is fabricated and the unresolved legacy count is unchanged |
| Server image processing | Deferred | Browser thumbnail only; guaranteed EXIF normalization and metadata stripping need approved infrastructure |
| Rules deployment | Manual | Review and run `firebase deploy --only storage` for the intended project |

## Phase 7J Assignment Checklist and Work Report

| Capability | Status | Notes |
| --- | --- | --- |
| Work Checklist | Completed | Eight virtual defaults, bounded custom items, three canonical statuses, independent save |
| Work Report | Completed | Five structured narrative fields plus informational materials |
| Active edit matrix | Completed | Assigned Rigger, matching Coordinator, or `super_admin`; strict `/assignment` remains required |
| Completed/Revisit behavior | Completed | Completed is read-only; Revisit preserves data and restores eligible editing |
| Concurrency | Completed | Independent revisions and latest-record Firebase transactions prevent stale overwrite |
| Completion prerequisite | Not introduced | Checklist, Work Report, materials, and photos remain optional |
| Audit and timeline | Preserved | Latest updater metadata only; no global audit or fabricated lifecycle event |

### Assignment Comments and Collaboration

| Capability | Status | Notes |
| --- | --- | --- |
| Plain-text Discussion | Completed | One isolated thread per Assignment; 2,000-character centralized validation |
| Add, edit, delete | Completed | Server identity/time; 15-minute ownership window; administrator soft delete |
| Realtime and pagination | Completed | Authenticated SSE over newest 30 Firebase comments; older push-key cursor pages |
| Completed/Revisit behavior | Completed | Completed is read-only; Revisit restores commenting and preserves history |
| Timeline and notifications | Preserved | No comment lifecycle events and no notification delivery |
| Future mentions/attachments | Prepared | Optional reply boundary documented; no active mention, attachment, or notification behavior |
### Assignment Dashboard and Analytics

| Capability | Status | Notes |
| --- | --- | --- |
| Read-only operational dashboard | Completed | Dedicated permission-aware Assignment dashboard route |
| KPI and trend aggregation | Completed | Bounded existing-record calculations; no aggregate writes |
| Coordinator/Rigger workload | Completed | Current-assignee attribution is explicitly labelled |
| Accessible responsive charts | Completed | Lazy native SVG/CSS charts plus authoritative data tables |
| Recent activity | Completed | Assignment timestamps plus bounded comment/photo thread sample |
| Average Pause Duration | Unavailable | Existing workflow intentionally stores no Resume timestamp |
| Production index/volume validation | Required | Confirm created-date index and 5,000-record behavior |
### Assignment SLA, Aging & Escalation

| Capability | Status | Notes |
| --- | --- | --- |
| Central SLA contract | Completed | One read-only configuration and evaluator for all surfaces |
| Dashboard summaries | Completed | SLA state totals and assignment aging buckets |
| List indicators and filters | Completed | Text badges, aging, SLA state, and aging-bucket filters |
| Detail SLA panel | Completed | Target, remaining/overdue time, durations, reasons, and limitations |
| Escalation delivery | Not implemented | Readiness only; no notification or scheduled job |
| Resume-dependent metrics | Unavailable | Existing records do not store a reliable Resume timestamp |

### User Invitation and Provisioning

| Capability | Status | Notes |
| --- | --- | --- |
| Administrator invitation form | Completed | Existing Users page and role discovery |
| Firebase Auth provisioning | Completed | Undisclosed secure temporary password |
| RTDB application profile | Completed | Existing fields and Active status only |
| Partial-failure recovery | Completed | Compensating Auth deletion with explicit escalation |
| Administrator audit | Completed | Shared `user.invited` append |
| Login and onboarding redesign | Not changed | Existing Forgot Password flow is reused |

### User Session Revocation and Account Deactivation

| Capability | Status | Notes |
| --- | --- | --- |
| Account deactivation | Completed | Auth disabled, refresh tokens revoked, RTDB Not Active |
| Account reactivation | Completed | Existing UID/password preserved and Auth enabled |
| Standalone session revocation | Completed | Explicit confirmation and Firebase token revocation |
| Cross-system recovery | Completed | Firebase disabled state restored after RTDB failure |
| Administrator audit | Completed | Three shared lifecycle actions |

### Administrator Audit Center

| Capability | Status | Notes |
| --- | --- | --- |
| Authorized list and detail | Completed | Server authorization and deep links |
| URL search/filter/sort | Completed | Case-insensitive safe-field contains search |
| Pagination | Completed | Server-built 25/50/100 DTO pages |
| Snapshot comparison | Completed | Added, removed, changed, unchanged |
| Audit mutation | Unavailable | Read repository exposes no writes |
| Large-volume indexing | Deferred | Current one-read in-memory strategy documented |

### Role and Privilege Reconciliation

| Capability | Status | Notes |
| --- | --- | --- |
| Central role contract | Completed | Exact identifiers, labels, mappings, and states |
| Shared assignable roles | Completed | User changes and invitations use seven current roles |
| Legacy compatibility | Completed | Existing values render without mutation |
| Privilege-only assignment | Prevented | `project_owner` and `web_admin` excluded |
| Alias or migration | Not implemented | No safe business mapping inferred |

### Roles Administration Redesign

Completed: compact authoritative KPIs, URL-backed local search and compatibility filters, semantic desktop table, complete mobile cards, protected-role explanations, preserved privilege-management navigation, and route-specific loading/empty states. No role lifecycle, API, authorization, query, or Firebase contract changed.

### Privileges Administration Redesign

Completed: compact access-control KPIs, URL-backed local search and proven-data filters, native collapsible category modules, desktop role matrix, mobile cards, critical administrator-path presentation, keyboard-safe confirmation, and route-specific loading/empty states. Existing strict-boolean PATCH behavior and final-administrator protection are unchanged.

## Phase 8 Towers

Implemented: new read-only directory and detail pages, protected GET APIs, Assignment-privilege navigation, responsive table/cards, bounded search/filters/cursor traversal, coordinate utilities, fixtures, and tests. Browser acceptance remains before production-ready status.

## Phase 8B Tower Related Assignments

Implemented: bounded exact-Tower-ID related reads, existing Assignment DTO reuse, shared terminal classification, bounded summaries, desktop table, mobile cards, existing Assignment-detail navigation, and safe missing/empty/error states. Automated validation is complete; authenticated browser acceptance remains.

## Phase 8C Tower Map View

Implemented: authorized `/home/towers/map`, 1,000-record bounded marker serialization, coordinate exclusion counts, existing filters, query-preserving view switching, dynamically imported MapLibre clustering, safe popups, bounds/reset behavior, responsive states, and privacy-safe no-tile rendering. Authenticated browser acceptance remains.

## Phase 8D Tower Create

Implemented: administrator-only single Tower creation, proven-field validation, push-key generation, atomic normalized Tower ID duplicate rejection, responsive modal/full-screen form, duplicate recovery navigation, and map coordinate prefill. Existing Tower reads and Assignment relationships remain compatible.

## Phase 9A Rigger Directory and Detail

Implemented: authorized read-only list/detail pages and GET APIs, proven `user.position` Rigger identification, inactive-record compatibility, URL-backed search and filters, bounded cursor pagination, single-window workload aggregation, bounded indexed recent history, responsive table/cards, and Assignment/Tower navigation. Automated validation is complete; authenticated browser acceptance is tracked in the Phase 9A closeout.
## Phase 8F Ã¢â‚¬â€ Tower Bulk Import

Complete. Strict administrators can download, validate, review, and atomically commit bounded create-only Tower CSV imports. Existing Towers and Assignments are never modified.
## Phase 8G Ã¢â‚¬â€ Tower Audit History

Complete. Tower Create, Edit, and Bulk Import now generate atomic append-only field-level events, with bounded Active `/assignment` history pages and no fabricated backfill.
# Mobile API compatibility

M4R is complete for `getRejectDropReasonList`, `getCurrentTime`, and `getCellDetails`. Android cutover and 17 routes are deferred.
# Phase M5R mobile compatibility

Implemented three read-only Android compatibility routes:
`getassignmentsById`, `getImageDetails`, and `getAorSummaryById`. Operational
cutover, write routes, authentication enforcement, and deployment remain deferred.
# Phase M6R mobile compatibility

Implemented read-only `getCellDetailsPerSector` and `getUtility`. Catalogs,
photo-card generation, Assignment queues, authentication, writes, hardening,
deployment, and Android cutover remain deferred.
# Phase M8R

Implemented legacy `updateImageDetails`; binary uploads, Storage, lifecycle
writes, Cell editing, hardening, deployment, and Android cutover remain deferred.

## Mobile compatibility M9R-C

Finished is implemented on updateAssignmentDetails. updateAssignmentToClosedByID and upload-completion branches remain deferred.

## Mobile compatibility M9R-D

Lifecycle replay, failure recovery analysis, concurrency, and migration readiness are characterized with 9 tests and 13 focused evidence documents. Runtime behavior is unchanged; unconditional cutover remains blocked.

## Phase M11R

Implemented locally: mobile policy matrix, rollout modes, token verification, active-profile and relationship authorization, safe errors/identifiers/audits, token-free login logging, logout revocation, fixtures, tests, and rollout documentation. Not deployed; production enforcement and Android cutover are not started.

## Phase M12R

Local Android Retrofit/DTO inventory, shadow evidence, security-mode checks, replay/failure coverage, bounded operation counts, staging checklist, and readiness assessment are implemented. Status is not production-ready: three Android-called routes, deferred lifecycle actions, Android Bearer integration, and live staging evidence remain outstanding.

## Phase M13R

Prepared locally: health/readiness endpoints, operational configuration, deterministic rollout cohorts, sanitized mobile logs, aggregate metrics, rollback controls, dashboards guidance, runbooks, and tests. Production cutover remains blocked and no deployment or traffic switch occurred.


## R15C Tower Detail Operations Workspace

Completed: bounded Tower/Assignment/Cell aggregate, sector-band matrix, Tower and Cell embedded images, people, recorded timestamps, informational data-quality checks, responsive states, and token-free metadata export.


## R17 AOR Report Center

Completed: bounded Assignment-backed report list/detail, URL filters, responsive table/cards, browser PDF preview, download, metadata export, Assignment/Tower integration, quality warnings, loading/error states, and Operations navigation.

## R20D Tower Map & GIS View

Complete. `/home/towers/map` reuses bounded MapLibre clustering over at most 1,000 existing Tower records, adds coordinate diagnostics, zero/null-safe network summaries, proven operational filters, synchronized accessible results, and Tower/dependency/history navigation. It adds no RTDB schema, writeback, archive, restore, or delete behavior.

## R20E-B Safe Tower Import Commit

Completed: strict-administrator original-file revalidation, bounded exact matching, valid new-Tower creation, changed-field-only existing-Tower updates, per-row atomic Tower-plus-audit transactions, optimistic conflict detection, retry-safe Tower ID uniqueness, typed confirmation, partial-result reporting, Firebase-key detail links, and formula-safe result CSV. No delete, archive, restore, duplicate repair, or RTDB schema change was added.

## R20G — Tower impact and Assignment synchronization
Implemented administrator-only impact preview and backward-compatible Tower PATCH orchestration. Eligible active Assignment snapshots can be synchronized through a 100-record fail-closed atomic transaction with Tower and Assignment audits; historical records remain unchanged.
# R20G-B Assignment Tower snapshot

Implemented: complete new-Assignment Tower snapshot, zero-safe Assignment detail display, active Assignment synchronization/backfill for explicit fields, and administrator-only bounded active repair with per-row audit and CSV results. Historical repair remains intentionally unsupported.

## R20G-C Correct snapshot sources

Implemented locally: Tower-owned creation/synchronization remains on `/tower`; seven Full Tower fields synchronize from exact `/image.assignment_id`; Tower-origin copies for those fields were removed; `justifikasi` is excluded as unresolved; maintenance repair is image-sourced, additive, bounded, duplicate-aware, and audited. Assignment Detail remains snapshot-only and `/cell` reverse aggregation was not introduced.

- Administrator Audit Center: bounded multi-source read model, filters, composite detail, redaction, responsive list, partial-source warnings, and bounded CSV export implemented.

## Assignment Timeline and Activity History

Completed: bounded read-only merge of Assignment audit, legacy lifecycle/revisit fields, Cell, Image, Assignment photo, and report metadata with deterministic deduplication, Audit Center redaction, responsive grouped filters, partial-history messaging, and administrator Audit Center linking.

## Notification Center

Completed: owner-scoped in-app feeds under notification_user, verified push-key ownership, bounded unread preview and cursor pagination, bell and dedicated Center UI, read/unread and mark-all-read actions, deterministic retry deduplication, safe deep links, and focused Assignment, Tower, user lifecycle, role and privilege producers. No external delivery channel or migration was added.

## Global Search

Completed: authenticated Ctrl/Cmd+K command palette and /home/search page, exact per-entity privilege enforcement, bounded parallel Assignment/Tower/Cell/Rigger/User/Report sources, deterministic exact-prefix-contains ranking, safe Firebase-key routes, stable cursor loading, and partial-source warnings. No search index, external service, query audit, or operational write was added.

## Reports Center milestone

Implemented /home/reports-center with seven authorization-aware report types, allowlisted columns and filters, bounded preview, server-generated CSV export, local presets, responsive presentation, exact privilege enforcement, and metadata-only export audit. AOR Reports remains unchanged at /home/reports. Scope is explicitly bounded, not a database-wide total.

## System Settings milestone

Completed /home/settings as a strict-administrator, typed read-only global configuration and status workspace. Existing constants are classified as deployment-managed or read-only; secrets and raw integration identifiers are excluded. No runtime settings root, writer, mutation API, feature-flag system, or operational data change was introduced.

## System Health & Monitoring milestone

Completed strict-administrator /home/admin/system-health and GET /api/admin/system-health with parallel timed read-only Auth, RTDB, Storage, Web, Mobile API, Notifications, Reports, and Audit checks; bounded Assignment/User workloads; bounded audit warnings/events; safe build metadata; manual refresh; partial-state rendering; and diagnostic details. No monitoring root, time series, alerting, or operational mutation was added.

## CI/CD and release hardening

Implemented repository-side environment validation, pinned Node/npm versions,
stable test groups, PR CI, scheduled local secret/dependency scanning, Storage
rules checks, standalone build packaging, a hardened non-root Dockerfile,
minimal release health metadata, approval-gated staging/production workflow
definitions, immutable release selection tests, and deployment/backup/rollback
runbooks. No deployment, backup, restore, migration, Firebase rules deployment,
or production data operation was executed. Staging and production remain
blocked on clean version control, remote/branch protection, isolated Firebase
projects, protected runners, approved VPS adapters, proxy evidence and a
successful staging rollback drill.
