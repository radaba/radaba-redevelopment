# Radaba Decision Log

## DEC-001: Preserve the existing database contract

**Status:** Accepted

**Decision**

The new Radaba application will preserve the existing Firebase Realtime Database paths, field names, and field types.

**Reason**

- Existing production data already uses this structure.
- The Android application may depend on the same structure.
- Renaming fields creates unnecessary compatibility risk.

**Consequences**

- Existing snake_case fields remain unchanged.
- No automatic database normalization is allowed.
- New fields require separate approval.

---

## DEC-002: Use incremental migration

**Status:** Accepted

**Decision**

Radaba will be migrated module by module rather than through a single full rewrite.

**Reason**

- Reduces operational risk.
- Makes testing and rollback easier.
- Allows validation against the legacy application.

**Initial sequence**

1. Authentication
2. Login UI
3. Dashboard
4. Operational modules

---

## DEC-003: Start with login and authentication

**Status:** Accepted

**Decision**

The first redevelopment milestone is login and authentication.

**Reason**

- It is a contained workflow.
- It establishes the visual system.
- It can be validated independently.
- It does not require database migration.

---

## DEC-004: Preserve Firebase Authentication

**Status:** Accepted

**Decision**

Firebase Authentication remains the authentication provider.

**Reason**

- Existing users already authenticate through Firebase.
- Changing providers would introduce account migration risk.
- The Android application may use the same provider.

---

## DEC-005: Preserve Realtime Database

**Status:** Accepted

**Decision**

The authentication migration will continue using Firebase Realtime Database rather than replacing it with Firestore.

**Reason**

- Existing user and privilege records are stored in RTDB.
- The legacy application uses RTDB queries.
- Changing databases is outside the current milestone.

---

## DEC-006: Preserve successful redirect

**Status:** Accepted

**Decision**

Successful authentication continues to redirect to:

```text
/home/assignment
```

---

## DEC-007: Exchange Firebase ID tokens for Admin session cookies

**Status:** Accepted

**Decision**

The browser authenticates with Firebase using in-memory persistence and sends its short-lived ID token to the application server. After Admin verification and existing RTDB status/privilege checks, the server creates the Firebase session cookie stored as the sole value of `__session`.

Protected requests verify session cookies with revocation checking. Logout decodes the cookie and revokes by decoded `uid`, while cookie clearing is unconditional.

**Reason**

This keeps passwords out of the application server, avoids browser-readable token persistence, preserves Firebase Authentication and RTDB contracts, and gives server-rendered protected routes a genuine revocable Firebase session.

---

## DEC-008: Use a server-protected layout with a client presentation shell

**Status:** Accepted

**Decision**

The `/home` server layout remains the authentication boundary. It resolves the authenticated user once and passes a minimal serializable identity view to a reusable client application shell. The shell owns only transient navigation interaction state.

Desktop navigation, mobile navigation, active state, and breadcrumbs share one typed route configuration. Privilege filtering remains a documented extension point until the existing RTDB privilege properties can be verified; Phase 5 does not invent permission fields or hide the approved routes.

**Reason**

This preserves Phase 4 server authentication, avoids duplicate client session fetching, keeps sensitive authentication data out of browser state, and provides one responsive shell for subsequent module migrations.

---

## DEC-009: Isolate the legacy Assignment read contract

**Status:** Accepted

**Decision**

Assignment migration begins with a typed, server-only read compatibility layer over the existing RTDB `assignment` path. Raw storage values remain distinct from normalized list values. Exact active composite fields and the `/assignment` role privilege rule are centralized and tested. No write surface or table UI is introduced in Phase 7A.

**Reason**

The legacy web and Android models contain type inconsistencies, while list handlers contain unresolved date, request-shape, duration, and pagination behavior. Isolating the confirmed read contract reduces risk without changing production data or operational workflows.

---

## DEC-010: Adopt a bounded Phase 7C CSV contract

**Status:** Accepted

**Decision**

Because no legacy CSV source is available, Phase 7C exports the nine confirmed read-only list fields, omits unresolved Duration, uses stored `YYYY-MM-DD` dates, a Jakarta-dated `radaba-assignments-YYYY-MM-DD.csv` filename, UTF-8 BOM, formula-injection protection, and a 5,000-row synchronous limit.

**Consequences**

The contract is explicit and safe but requires comparison against a representative legacy export before claiming exact consumer equivalence.

---

## DEC-011: Preserve push-key privileges and restrict administration to super administrators

**Status:** Accepted

**Decision**

The existing `privilege` push-key collection remains the authorization source. Phase 6A defines administrators as active verified `super_admin` users with strict `/privilege` access. Commands update only existing role, status, or boolean children and protect final administrative access.

**Consequences**

Duplicate privilege paths remain visible and independently editable. Check-then-write protection has a documented concurrency race. No role or audit node is introduced.

## Phase 7E decisions

CSV-only; exact ordered headings; email user identifiers; 1 MiB/200-row limits; all-or-nothing policy; commit reparses the original file; no persistent idempotency or lock node.

- Phase 7E user reference decision: exact normalized email is explicitly approved for rno, rigger, and coordinator import columns.

---

## DEC-012: Redesign Assignment presentation without changing its data contract

**Status:** Accepted

**Decision**

The Assignment list uses a compact enterprise operations layout with a clear action hierarchy, a unified search/filter workflow, removable applied criteria, a sticky desktop table, complete mobile cards, and truthful range pagination. Existing URL state, debounce timing, server authentication, authorization, repositories, APIs, write commands, and Firebase contracts remain unchanged.

**Reason**

The previous separate search and filter cards consumed excessive vertical space and obscured the primary workflow. The presentation redesign improves scanability and responsive operation without expanding backend scope or fabricating a record total.

---

## DEC-013: Resolve Assignment details by push key and display only verified capabilities

**Status:** Accepted

**Decision**

Assignment list View links and the dynamic detail route use the existing Firebase push key. The protected server page reads exactly `assignment/{key}`, maps confirmed legacy fields into a typed read-only view, and displays lifecycle entries only when stored timestamps exist. The dashboard exposes the existing rigger reassignment plus refresh, print, and a stored report link; it does not fabricate priority, completion percentage, comments, attachments, activity history, related records, or unsupported edit/delete commands.

**Reason**

Push keys already identify list rows and provide a direct bounded RTDB read. Restricting the dashboard to confirmed fields preserves Android and legacy compatibility while avoiding misleading operational controls.

---

## DEC-014: Make the rigger immutable after Assignment completion

**Status:** Accepted

**Decision**

Rigger reassignment is rejected when current or legacy stored completion indicators show that an Assignment is completed. The shared UI displays a locked state, the command service fails early, and the repository repeats the rule in an RTDB transaction immediately before updating the existing rigger-dependent fields. The completed conflict is HTTP 409 with code `ASSIGNMENT_COMPLETED`; an aborted transaction writes nothing.

**Reason**

UI restrictions cannot protect against direct requests or concurrent workflow changes. Transactional revalidation preserves the established schema and fields while ensuring completion wins over reassignment without adding locks, history, or audit nodes.

---

## DEC-015: Reopen a completed Assignment in place with record-local revisit history

**Status:** Accepted

**Decision**

A completed Assignment may be revisited through an authenticated, reason-required command. One RTDB transaction revalidates completion, retains the same push key and Assignment ID, changes the established workflow fields to `On Progress` and `Open`, increments `revisit_count`, stores latest revisit metadata, and appends an event beneath `revisit_history`. Existing completion timestamps and record data remain unchanged. No separate notification or global audit structure is introduced.

**Reason**

Reopening in place preserves reporting identity and Android/legacy compatibility. Transactional validation prevents direct clients and concurrent requests from reopening an ineligible record, while record-local events provide chronological context without inventing an unconfirmed cross-application audit schema.

---

## DEC-016: Lock only actual Rigger changes on completed Assignments

**Status:** Accepted

**Decision**

The completed Assignment rule compares the trusted requested Rigger with the latest persisted Rigger before rejecting. Normalized email is the primary identity, with normalized name used only for legacy records lacking email. A same-Rigger submission is an unchanged outcome and writes nothing. A different or cleared Rigger remains forbidden. The Firebase transaction repeats the comparison and completion predicate immediately before any update, while active records continue rebuilding the established Rigger-dependent fields.

**Reason**

Immutability concerns changes, not idempotent resubmission. Performing the decisive comparison inside the existing-record transaction prevents stale clients and concurrent completion from bypassing the rule without introducing override flags, locks, bulk behavior, or a new audit schema.

---

## DEC-017: Build Assignment history from confirmed record evidence

**Status:** Accepted

**Decision**

The Assignment Detail page uses one normalized chronological timeline built from the existing lifecycle datetime fields and record-local `revisit_history`. Creation metadata may show the currently stored initial Rigger, coordinator, and category, while revisit events use their explicitly stored actor, reason, and status transition. The timeline does not fabricate comments, attachments, photo uploads, progress changes, generic updates, or historical actors that are not stored. Revisit activity is shown once in the comprehensive timeline rather than duplicated in a second activity section.

**Reason**

The existing Assignment record is the only confirmed compatible history source, and the detail route already reads it under the correct permission boundary. Reusing that read avoids duplicate storage and queries. A pure event builder and semantic presentation component make ordering, timestamp formatting, empty behavior, responsiveness, and accessibility testable without changing Assignment workflow or Firebase writes.

---

## DEC-018: Extend Assignment workflow only through confirmed legacy states

**Status:** Accepted

**Decision**

The first write-enabled workflow phase centralizes the existing `assignment_state` values and exposes only `Open` ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ `Accepted`, `Accepted` ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ `On Progress`, and `On Progress` ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ `Paused`. Clients submit an action rather than a state or timestamp. The server supplies Jakarta timestamps, and one transaction validates the latest state and updates the established lifecycle fields and created-date composites. The existing `/assignment` privilege applies uniformly.

**Reason**

These transitions have confirmed state and timestamp fields and already drive the timeline. Restricting the phase avoids inventing new status strings, fields, role semantics, or repeated-event history while protecting against stale clients and concurrent legacy/Android writes.

---

## DEC-019: Resume without fabricated history and complete with an explicit actor

**Status:** Accepted

**Decision**

Resume returns `Paused` to `On Progress` without overwriting `checkin_*` or `paused_*` and without adding a Resume timeline event. Complete maps `On Progress` to the canonical `Finished` state plus `assignment_status=Completed`, `completed=true`, Jakarta completion timestamps, dependent composites, and optional `completed_by_uid` / `completed_by_name`. Both actions use the existing bounded transition endpoint and latest-record transaction.

**Reason**

The legacy model has no reliable Resume timestamp, so preserving evidence is safer than repurposing Work Started fields. Completion has established state, flag, timestamp, and composite semantics; the two approved actor fields make attribution explicit without overloading operator or Rigger identity fields. Atomic validation ensures completion triggers existing lock and Revisit behavior safely.

---

## DEC-020: Isolate Assignment evidence metadata and deny direct Storage access

**Status:** Accepted

**Decision**

Structured Before, During, and After evidence is stored beneath `assignment_photo/{assignmentPushKey}/{photoId}`, with binary originals and optional thumbnails in Assignment-scoped Firebase Storage paths. Revocation-aware server APIs own listing, upload, content, and deletion; Storage rules deny all direct clients. Completed evidence is read-only until Revisit. Legacy `image_total`, workflow transitions, and timeline event types remain unchanged.

**Reason**

A separate metadata node avoids enlarging legacy Assignment transactions and protects Android compatibility. Server-owned paths, identity, timestamps, signature validation, and transactional category quotas prevent request tampering and cross-Assignment access. Preserving `image_total` avoids assigning new meaning to an unresolved production field.

---

## DEC-021: Keep bounded work execution on the Assignment for atomic lifecycle checks

**Status:** Accepted

**Decision**

Store optional `work_checklist` and `work_report` children on the existing Assignment. Save each section independently through a transaction that verifies current completion, trusted Rigger/Coordinator/administrator relationship, and expected section revision. Render server-owned checklist defaults virtually until first save. Keep execution data optional for completion and out of the lifecycle timeline.

**Reason**

A separate RTDB node could race completion because Storage-style cross-service cleanup is not applicable and RTDB cannot atomically compare another branch without a broad root transaction. The bounded record-local structures allow the established Assignment transaction to make completion and edits mutually exclusive while preserving Revisit and Android-compatible optional-field behavior.

---

## DEC-022: Isolate Assignment Discussion and stream only the newest page

**Status:** Accepted

**Decision**

Store comments beneath `assignment_comment/{assignmentPushKey}/{commentPushKey}`. Authenticated server APIs own validation, identity, timestamps, idempotency, edits, and soft deletion. An HttpOnly-session-protected server-sent events route listens through Firebase Admin only to the newest bounded page. Older comments use exclusive push-key cursor pagination. Completed Assignments are read-only until Revisit.

**Reason**

Keeping unbounded collaboration outside `assignment/{pushKey}` avoids enlarging workflow transactions and preserves legacy/Android compatibility. Server-sent events reuse the established session and privilege boundary without adding direct browser RTDB authorization. Soft deletion retains Assignment history, while keeping comments out of the lifecycle timeline preserves its workflow focus.
---

## DEC-023: Derive bounded Assignment analytics without aggregate storage

**Status:** Accepted

**Decision**

Build the Assignment Dashboard from one bounded existing `created_date` query, pure in-memory filtering and aggregation, and at most 12 sampled nested Assignment threads for comment/photo activity. Default to Last 30 Days, limit custom ranges to 366 days, stop exact processing at 5,000 records, use current-assignee attribution, and render lazy native charts with accessible data tables. Do not persist aggregates or modify workflow data.

**Reason**

Realtime Database has no compatible multi-dimensional aggregation or nested collection-group query. Bounded server reads preserve the read-only milestone and existing security/data contracts. Explicit limits, cohort labels, unavailable pause duration, and sampled nested activity prevent fabricated precision while still providing operational insight.
---

## DEC-024: Calculate Assignment SLA at read time from existing timestamps

**Status:** Accepted

**Decision**

Use one centralized read-only SLA contract with targets of 24 hours for Open, 12 hours for Accepted, 72 hours for On Progress, and 24 hours for Paused. Warn at 75%, mark overdue after the target, and mark escalation-ready after 24 overdue hours, 24 paused hours, or two revisits. Reuse bounded queries and existing permission gates. Do not persist results, notify users, schedule jobs, or infer missing Resume timestamps.

**Reason**

Read-time derivation preserves Firebase and Android compatibility and cannot alter workflow behavior. Explicit Unavailable and Not Applicable states avoid fabricated operational metrics, while a shared evaluator keeps dashboard, list, and detail behavior consistent.

---

## DEC-025: Page the existing Users collection in the server read model

**Status:** Accepted

**Decision**

Enhance `/home/admin/users` with canonical URL search, exact filters, deterministic sorting, and bounded page DTOs. Continue reading the existing RTDB user and privilege collections without new fields or indexes, and send only the selected 25, 50, or 100 rows to the client. Preserve role discovery and all existing role/status commands.

**Reason**

The current collection is small enough for the established read while transferring and rendering every record is unnecessary. RTDB cannot combine the requested multi-field search and filters with true cursor pagination without a new query or indexing strategy. Keeping that optimization separate preserves compatibility and leaves the documented role mismatch unchanged.

---

## DEC-026: Identify User detail records by RTDB push key

**Status:** Accepted

**Decision**

Use `/home/admin/users/{userPushKey}` for a read-only application-profile detail. Read exactly `user/{userPushKey}` and the existing privilege collection, map display-safe legacy fields, and derive effective access only from strict boolean fields for the stored role. Defer Firebase Auth metadata and do not create account history.

**Reason**

The push key is unique and directly readable even when legacy UID values are missing, duplicated, or stale. Separating optional Auth metadata avoids coupling the first detail milestone to another service and prevents unavailable history from being inferred.

---

## DEC-027: Treat Firebase Auth metadata as optional User detail evidence

**Status:** Accepted

**Decision**

After the direct RTDB profile read, optionally call Firebase Admin `getUser` for a usable stored UID while reading privileges concurrently. Serialize only UID, email, email verification, disabled state, account creation, last sign-in, and provider identifiers. Represent no UID, missing account, and lookup failure explicitly and retain RTDB as the source of truth.

**Reason**

Authentication metadata improves administrator visibility but is a separate service snapshot that may be absent or inconsistent. A sanitized optional gateway preserves the existing login/session behavior, avoids sensitive Auth exposure, and permits warnings without automatic repair or schema changes.

---

## DEC-028: Record administrator audit as a separate best-effort append

**Status:** Accepted

**Decision**

Store generic administrator audit records under `administrator_audit/{generatedAuditId}` through an append-only repository. Complete the established administrative mutation first, then attempt one sanitized audit append. Initially integrate only user role and status changes.

**Reason**

RTDB cannot atomically combine the existing narrow user-child write with a new audit branch without widening the transaction boundary and changing established behavior. Best-effort recording preserves business authority and compatibility while making failures visible through sanitized internal logging. A generic action/resource contract permits future modules to reuse the recorder without duplicating persistence or sensitive-field filtering.

---

## DEC-029: Provision users with Auth-first compensation

**Status:** Accepted

**Decision**

Create Firebase Authentication first to obtain the canonical UID, then write an existing-shape RTDB `user` push record with `Active` status. Generate but never disclose a temporary password; onboarding uses the existing Forgot Password flow. If RTDB creation fails, delete the new Auth account. Surface failed compensation with a request identifier. Record successful provisioning through `user.invited`.

**Reason**

Auth and RTDB cannot share a transaction. Explicit compensation prevents silent orphan accounts while preserving the current schema, authorization model, and login experience.

---

## DEC-030: Coordinate lifecycle with reversible Firebase state

**Status:** Accepted

**Decision**

For status changes, update Firebase disabled state before RTDB, revoke refresh tokens during deactivation, and restore the prior Firebase disabled state if RTDB fails. Use a separate confirmed command for session revocation. Preserve UID, password, profile, roles, privileges, and existing status values. Audit successful actions through the shared recorder.

**Reason**

Firebase Auth and RTDB cannot participate in one transaction. Ordering and compensation prevent silent status divergence while leaving the existing login resolver, which already checks revocation and `Not Active`, unchanged.

---

## DEC-031: Start Audit Center with server-only in-memory querying

**Status:** Accepted

**Decision**

Authorize before one RTDB audit collection read, map to defensive display records, and perform URL-driven search, exact filters, approved deterministic sorts, and pagination in server memory. Use a dedicated authorized detail route and a separate read-only repository. Add no indexes or denormalized nodes.

**Reason**

Current audit volume is unknown and RTDB cannot combine the requested filters natively without new access patterns. The simplest compatible strategy sends only selected DTO pages to rendering, clearly documents its scaling limit, and guarantees that reads cannot mutate or recursively audit themselves.

---

## DEC-032: Reconcile roles without aliases or migration

**Status:** Accepted

**Decision**

Define seven exact assignable roles centrally. Preserve `project manager` as legacy read-only and `project_owner` / `web_admin` as privilege-only. Keep exact privilege keys and strict boolean authorization. Do not alias, rewrite, or migrate stored data.

**Reason**

Production evidence confirms mismatched sets but no intended equivalence. Explicit assignability closes dynamic-role escalation risk without changing existing stored records or broadening route access.

## DEC-033: Bound Towers traversal without new indexes

**Status:** Accepted

Use the proven `tower_id` query for exact-first search and stable `orderByKey` cursor windows capped at 500 for server-side fallback matching. Label counts as bounded and do not claim global completeness. This preserves the current RTDB schema and avoids unbounded browser or server reads.

## DEC-034: Reuse exact Tower ID Assignment query with a bounded key window

**Status:** Accepted

Query `assignment` by exact `tower_id`, take at most 20 last key-ordered matches (hard maximum 50), and sort only that bounded set by `created_datetime` with key tie-breaking. This reuses the proven relationship query without a new index or full scan. It deliberately does not claim authoritative totals or globally newest history.

## DEC-035: Render Tower geography without an unapproved external tile host

**Status:** Accepted

Reuse installed MapLibre GL with client-side GeoJSON clustering and a local background style. Do not hard-code OpenStreetMap or another external provider because tile requests would disclose operational geographic viewport data to that destination. An external basemap requires separate destination and CSP approval.

## DEC-036: Identify Riggers by the existing position contract

**Status:** Accepted

Treat a `user` child as a Rigger when trimmed `position` equals `rigger` case-insensitively, matching the established Assignment picker. Do not require Active status for directory membership; status remains a filter and historical inactive records remain readable.

## DEC-037: Relate Riggers to Assignments by exact normalized email in bounded reads

**Status:** Accepted

Use normalized exact `user.email` to `assignment.rigger_email` as the relationship. For detail history, use the existing name/date composite only to obtain a bounded candidate set, then require email equality. For directory workload, read one bounded newest-key window and group in memory. Do not infer a name-only fallback, add indexes, or claim global totals.

## DEC-038: Group privilege administration by stored category

**Status:** Accepted

Use existing `privilege.category` values as access-control modules, derive assignment and critical-path summaries solely from strict role booleans and the exact `/privilege` path, and perform presentation search/filtering over the already loaded collection. Do not create a parallel module taxonomy, description field, protection field, lifecycle action, query, or API. This keeps the redesigned access-control center aligned with the authoritative Firebase contract and existing final-administrator policy.

## DEC-039: Create Towers with push keys and collection-transaction uniqueness

**Status:** Accepted

Reserve the established Firebase push key, validate only operationally proven scalar fields, and transact on the existing `tower` collection to atomically compare normalized `tower_id` values before appending one child. Require the existing administrator boundary for POST while preserving Assignment privilege for reads. Do not add a uniqueness node, index, deterministic key, audit schema, creation metadata, or unsupported form field.
## Phase 8F Tower import decisions

- Reuse the project-standard 1 MiB/200-row CSV limits and Tower Create normalization.
- Use create-only imports, one bounded conflict read, and one collection transaction; defer upsert and a new uniqueness schema.
- Reparse the original file at commit instead of trusting browser-normalized rows or adding a signing mechanism.
## Phase 8G Tower audit decisions

- Do not reuse best-effort, administrator-only `administrator_audit` for operational Tower history.
- Store compact events at `tower_audit/{towerKey}/{auditKey}` and atomically transact Tower plus audit sibling branches.
- Use verified session actors, server timestamps, primary actions, canonical field diffs, and no-change suppression.
- Defer export, correction, rollback, deletion, and fabricated backfill.
# DEC-040: Isolate mobile v1 compatibility

Preserve `/api/mobile/*` through separate adapters and operation-specific repositories. Start with three read-only routes, keep policies non-enforcing, test with fakes, and leave legacy read-only.
# Phase M5R decision

Selected three bounded, Android-proven assignment/image reads. Queue/list routes
were deferred because their ordering and pagination semantics require separate
contract reconstruction. Legacy unauthenticated behavior and error asymmetry are
preserved for compatibility; this is not a security-policy endorsement.
# Phase M6R decision

Selected two routes only: the remaining bounded Cell lookup and the
Android-proven utility read. Deferred the untracked catalog implementation and
unbounded photo-card generator rather than claim uncertain compatibility.
# Phase M8R decision

Selected only the Android-proven metadata/URL upsert. No photo-card, byte upload,
Storage, lifecycle, metric, or security behavior was added.

## 2026-07-27 - M9R-B bounded Assignment transitions

Implemented the legacy updateAssignmentDetails route only for Paused, Rejected, Dropped, and On Progress. The unsafe broad-update and finish/close branches are rejected before Firebase access and remain deferred. One Assignment update means no partial-write state inside this slice.

## 2026-07-27 - Select Android-proven Finished branch only

M9R-C implements Finished through updateAssignmentDetails with exact related-record and achievement fan-out. updateAssignmentToClosedByID is deferred because the current Android Retrofit contract is absent. No security, idempotency, or atomicity repair is introduced.

## 2026-07-27 - Characterize lifecycle recovery without changing it

M9R-D records that simple transitions are last-write-wins and Finished is non-atomic and counter-incrementing on replay. Recovery remains manual observation only: no retry, compensation, marker, repair script, route, field, or migration is introduced.

## 2026-07-27 - Select only updateCellDetails for M10R

Legacy and Android evidence proves one Cell/Sector write API. Implemented updateCellDetails with exact mirror rules and Cell-only upsert behavior. Independent create/sector/PCI/azimuth/antenna/tilt route names were not invented. Writes are awaited for deterministic App Router failure handling, preserving the established conservative timing gap.

## M11R decisions

- Preserve paths and successful DTOs; make hardening an explicit rollout mode.
- Default to legacy-compatible and prohibit production enforce in this phase.
- Trust verified token/profile and stored relationships, never request role/identity.
- Do not invent mobile privilege codes; use proven roles and relationships.
- Remove token persistence from login logs and revoke refresh tokens on authenticated logout.
- Defer broad replay/transaction changes until Android request IDs and schema semantics are approved.

## M12R decisions

- Record missing Android-called routes and deferred lifecycle states as blockers rather than infer contracts.
- Use deterministic local shadow comparisons; do not claim live staging evidence without a target and approved data.
- Do not modify Android to activate Bearer authentication in this phase.
- Production readiness remains blocked; no rollout, schema, dependency, or traffic change is authorized.

## M13R decisions

- Implement inert rollout selection rather than traffic switching.
- Keep legacy fallback disabled and unimplemented; a flag does not imply a network fallback.
- Separate liveness, configuration readiness, and governance approval.
- Use bounded in-process metrics pending an approved external sink.
- Preserve all M12 blockers and prohibit deployment in this phase.


## R15C decisions

Use the Tower Firebase child key as the route identity and `tower_id` as business identity. Resolve the newest bounded Assignment by exact Tower ID, merge bounded Cells found by Tower ID and that Assignment ID, never merge sector-band duplicates, reuse R15A image normalization, and retain the existing page-level Tower authorization boundary.


## R17 decisions

Treat `assignment.report_name` and `assignment.report_url` as the authoritative report pair; treat sample `download` as presentation-only. Use SHA-256 over Assignment key and field key for report IDs, preserve ambiguous slash dates raw, use a 200-record recent bounded window, and do not create a report node or PDF proxy.

## R20G — synchronize only eligible Assignment snapshots
Use the established exact ssignment.tower_id === tower.tower_id relationship. Default Tower edits to no synchronization. When explicitly selected, recalculate a bounded impact and atomically update only existing allowlisted fields on active Assignments, preserving historical and unknown records. Add ssignment_audit as an append-only synchronization audit path; exclude ambiguous u850/l850/l2300 fields (superseded for l850/l2300 by the confirmed operational rule below) and fail closed above 100 related records.
## R20G radio snapshot correction

Confirmed `assignment/l850` and `assignment/l2300` are established lowercase operational numeric snapshot fields consumed by Android finish/image workflows. Tower edits may synchronize those fields only when they already exist on eligible Assignments; zero remains numeric zero. `u850` remains excluded because equivalent Assignment/mobile evidence was not confirmed. No RTDB path or field name changes.
# R20G-B snapshot decision

Assignment Tower data remains snapshot-based. Active Assignments may receive current allowlisted Tower values; historical Assignments are preserved. Legacy repair is administrator-only, active-only, additive, bounded, audited, and resolves Towers by exact `tower_id` without guessing.

## R20G-C source correction

Use `/tower` for site/location/radio master snapshots and exact `/image.assignment_id` for the seven proven Full Tower form values. Do not fabricate Image-owned values during Assignment creation or overwrite them from Tower edits. Keep detail reads on Assignment only, preserve historical snapshots and source scalar types, and reject conflicting duplicate Images during maintenance. Do not reverse-derive aggregates from `/cell`. Exclude `justifikasi` until its persisted key and type are directly proven.

## Administrator Audit Center

Audit Center uses an application-side bounded merge of the existing `administrator_audit`, `assignment_audit`, and `tower_audit` roots. No global audit index or schema was introduced. Composite source identity prevents cross-root ID collisions; all presentation and CSV data passes through centralized redaction.

## Assignment Activity History

Use explicit Assignment audit first, explicit revisit/evidence/report metadata next, and clearly labeled Assignment-field inference last. Normalize only in memory, cap every source at 100, merge reads in parallel, deduplicate by type and second-precision timestamp with stable source-key tie breakers, and reuse Audit Center redaction. Do not add an event root or alter mobile writes.

## Notification delivery boundary

Use the existing RTDB user Firebase push key as notification ownership at notification_user/{userKey}. Resolve it from the verified session and never accept it from clients. Existing source modules commit separately, so create deduplicated notifications best-effort only after operational success; delivery failure does not roll back the source operation. Use bounded unread queries instead of a denormalized count until measured volume justifies a reviewed schema addition.

## Global Search bounded-window decision

RTDB cannot perform case-insensitive multi-field search. Use only exact canonical per-entity privileges and bounded newest-200 orderByKey windows, merged with Promise.allSettled and ranked in memory. Treat results as bounded rather than exhaustive. Reuse existing Firebase-key and report-hash routes. Defer any denormalized search index or external engine until a separately reviewed milestone.

## Reports Center decisions

- Reused existing granular privileges rather than adding a new /reports-center record.
- Reused Audit Center normalization/redaction and the existing administrator audit writer.
- Limited preview to 75 and export to 500 records from newest-500 source windows; no export-all claim.
- Kept CSV as the only format; no tabular PDF generation.
- Kept presets browser-local and export history in existing audit events; no new RTDB path or file content.
- Omitted unsupported duration metrics and N+1 Firebase Auth enrichment.

## Runtime grouping and notification index compatibility

Replace unsupported Object.groupBy with a reducer-based Global Search helper ordered by the canonical entity list. Avoid adding a partial RTDB rules file when deployed rules are unknown; replace the notification unread ead-indexed query with a bounded push-key window plus server-side unread filtering. No authorization rule is changed.

## System Settings storage and editability

No existing system_settings root or centrally enforced mutable configuration was found. Do not create an unapproved RTDB schema or expose code/environment controls as editable. Deliver an administrator-only allowlisted status catalog; defer persistence, review/save, revisions, and settings audit until a schema and cross-client enforcement contract are approved.

## System Health monitoring boundary

Reuse existing readiness and Audit Center contracts, add only short-timeout read checks, and label bounded metrics honestly. Console-only failures cannot be reconstructed as history. Do not create monitoring persistence, public diagnostics, external probes, alerts, or destructive end-to-end checks. Overall health requires all critical checks rather than page availability.

## CI/CD artifact and deployment boundary

Adopt the Next.js standalone bundle as the canonical artifact and provide a
multi-stage non-root Docker packaging option. Build staging and production once
inside their protected environment because browser Firebase variables are
compiled into the artifact. Use fixed operator-owned adapters on protected
self-hosted runners for fingerprint verification, backups, deployment, proxy
switching and restore checks. Do not guess an absent VPS/Nginx implementation,
publish from pull requests, place secrets in artifacts, deploy Firebase rules,
or execute production changes during this milestone.
