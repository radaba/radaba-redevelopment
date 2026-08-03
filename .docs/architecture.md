# Radaba Architecture

## Authenticated application shell

All `/home` routes inherit the server `HomeLayout`. The layout verifies `__session` through the shared Phase 4 resolver with revocation checking, resolves the existing RTDB user and privilege payload, and redirects failures to `/login`.

The layout creates a minimal serializable user view containing display-safe profile fields. It passes that view to the client `ApplicationShell`; UID, session data, tokens, cookies, and raw privilege JSON are not exposed by the shell.

```text
HomeLayout (server authentication boundary)
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ ApplicationShell (client UI state and user context)
    Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ ApplicationSidebar
    Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ MobileNavigation
    Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ ApplicationHeader
    Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Breadcrumb
    Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ UserMenu / LogoutButton
    Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ Route page
        Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ PageHeader
```

The client shell owns only transient presentation state: sidebar collapse, mobile drawer visibility, and user-menu visibility. It performs no session fetching and persists no state in browser storage.

## Navigation

`navigation-config.ts` is the single route metadata source for desktop navigation, mobile navigation, active states, and breadcrumbs. Phase 5 contains Assignment, Profile, and Settings.

The RTDB privilege payload remains unchanged. Because its properties are not yet documented, Phase 5 uses a typed filtering extension point that returns the approved navigation unchanged rather than inventing permission semantics.

## Assignment read compatibility layer

Phase 7A adds a server-only Assignment read boundary. Raw RTDB records, normalized list items, date/query contracts, exact composite mappings, and route permission logic stay outside React components. The repository reads only the existing `assignment` path and exposes lookup and list operations, not writes. The real table remains deferred to Phase 7B.

## Assignment search and export

Phase 7C centralizes Assignment ID and Tower ID query construction beside the Phase 7A query contract. The client owns debounced URL interaction only. The server page and export route parse the same typed URL state; the export route independently resolves the authenticated user, enforces `/assignment`, invokes the read repository, and serializes normalized list rows.

## Administrator management

Phase 6A corrects privilege resolution to read the existing push-key `privilege` collection. A server-only authorization helper derives administrator access from the verified session. Read repositories, explicit command services, and independently protected API routes separate reads from field-level writes. The shell receives only `isAdministrator`, never raw privileges.

Administrator audit uses a generic safe contract and an append-only Firebase repository at `administrator_audit/{generatedAuditId}`. Integrated commands complete their authoritative write first, then invoke the best-effort recorder. Initial integration is limited to user role and status changes.

User provisioning extends the same administrator boundary through `POST /api/admin/users`. Firebase Auth is created first to obtain the UID, followed by an existing-shape RTDB `user` push record. RTDB failure triggers compensating Auth deletion; successful provisioning records `user.invited` through the shared audit writer.

Account lifecycle coordination reuses the same boundary. Status changes synchronize Firebase disabled state with RTDB `Active` / `Not Active`, while a dedicated endpoint revokes refresh tokens. RTDB failure triggers restoration of the prior Firebase disabled state. All successful actions use the shared audit writer.

The Administrator Audit Center separates read and write repositories. Authorized server pages perform one audit collection read for URL-driven in-memory query and selected-page DTO construction; detail uses one direct child read. Neither path references the audit writer.

Administrator role writes, invitations, selectors, and User Detail share one exact-string role contract. Privilege inventory discovery remains separate from assignability so privilege-only fields cannot become user roles dynamically.

## Bulk import boundary

AssignmentImportService parses/resolves batches and delegates record preparation to AssignmentCommandService. FirebaseAssignmentCommandRepository performs the single named multi-location create.

## Assignment detail dashboard

The dynamic `/home/assignment/[assignmentId]` segment contains the existing Firebase push key used by list View links. The server page repeats exact `/assignment` authorization, validates the key, and reads only `assignment/{key}` through `AssignmentReadRepository.findByKey`. A pure typed mapper converts the raw legacy record into display-safe detail fields. The detail UI never accesses Firebase from the browser and introduces no database writes or fields.

## Assignment revisit command

Completed Assignments are reopened through `POST /api/assignments/{assignmentId}/revisit`. The authenticated command service validates the mandatory reason and current status, while the Firebase repository repeats the completed-only rule inside one transaction on the existing Assignment record. The command keeps the same Assignment key and ID, changes the established workflow fields to `On Progress` / `Open`, and appends record-local revisit history for the detail timeline.

## Towers directory

Phase 8 follows the Assignment server boundary with typed Tower mapping, a read-only repository, stable bounded cursor queries, server pages, protected GET APIs, and minimal client interaction. Raw RTDB snapshots never cross into UI components.

## Tower Related Assignments

The Tower server detail page performs one direct Tower read followed, only when `tower_id` exists, by one bounded method on the existing Assignment read repository. The normalized Assignment list DTO is passed to a server-rendered responsive section; no API, client Firebase access, second Assignment model, or N+1 lookup is added.

## Tower map view

The existing Tower repository performs a 1,001-record key-ordered read to detect a 1,000-record bound, applies existing filters, and returns a minimal marker DTO. The server page authorizes before reading; only the dynamically imported MapLibre canvas is SSR-disabled. No map API, browser Firebase read, Assignment lookup, or external tile request is introduced.

## Tower create command

Tower creation uses a separate administrator-authorized command repository and service. The browser submits proven fields to the existing Tower collection endpoint. The server validates and normalizes the payload, reserves a push key, and runs one collection transaction that rejects a normalized Tower ID duplicate or adds exactly one child. Read repository interfaces remain write-free.
## Tower import boundary

CSV parsing/serialization lives in the Tower feature contract, request file enforcement and orchestration remain server-side, and Firebase access is repository-only. Validation uses one bounded ID read; commit uses one atomic collection transaction and never performs row-by-row writes.
## Atomic Tower history

The Tower command service builds trusted audit events; the Firebase command repository commits `tower` and `tower_audit` sibling branches in one root transaction. A separate read-only repository performs scoped push-key cursor reads and exposes no append/update/delete method.
# Mobile API compatibility

Legacy Android v1 routes use a separate compatibility architecture under
`src/server/mobile-api` and `src/app/api/mobile`. They intentionally bypass the
standard web API envelope while reusing Firebase Admin through operation-specific repositories. See `.docs/mobile-api-compatibility`.
# Phase M6R mobile compatibility

The v1 compatibility layer now includes operation-specific sector and utility
reads under `src/server/mobile-api`. Thin App Router endpoints delegate to
read-only services and Firebase Admin adapters.
# Phase M8R mobile image compatibility

An operation-specific image command boundary performs legacy Assignment reads,
Cell tower-height fan-out, and image metadata upserts without Storage.

## Mobile M9R-C finish compatibility

The mobile Finished branch uses a route-specific service and repository. Related records are written sequentially before the Assignment; achievement transactions run concurrently afterward. It is intentionally separate from redevelopment Assignment commands.

## Mobile M9R-D lifecycle evidence

The compatibility boundary now has a machine-readable lifecycle parity matrix and cross-route characterization suite. Runtime services remain request-local; RTDB provides only per-write or per-counter transaction guarantees, not workflow atomicity.

## Mobile M10R Cell/Sector writes

The Android-proven updateCellDetails route uses an operation-specific Cell command repository. It performs an rcell_id equality read followed by update-all-or-push behavior. Sector is an identity encoded in Cell records, not a separate aggregate or node.

## Mobile API security layer (M11R)

Mobile handlers are fronted by a central policy registry, token resolver, Firebase verifier/repository adapter, request-scoped evaluator, safe error mapper, and sanitized audit sink. The layer is mode-controlled and does not alter Firebase schema.

## M12R staging validation boundary

M12R adds no runtime component. It treats Android Retrofit source, compatibility fixtures, the App Router manifest, security policies, and fake-repository operation traces as a local shadow-validation system. Live staging execution requires an explicitly approved endpoint and sanitized data; no operational Firebase is contacted by the harness.

## M13R operational framework

The server now has centralized operational flags, deterministic rollout selection, bounded in-process metrics, sanitized mobile request logging, and /live, /ready, and /health routes. These primitives do not route traffic, call legacy fallback, deploy, or enable production enforcement.


## R15C Tower operations workspace

`/home/towers/{towerKey}` composes a server-only read aggregate from one direct Tower record, bounded exact Tower Assignments, and bounded Cell queries by direct `tower_id` and newest `assignment_id`. Pure read-layer code groups sector-band records, normalizes embedded images through R15A, and derives people, recorded timestamps, and warnings. Nothing is persisted.


## R17 AOR Report Center

R17 derives read-only AOR report records from bounded existing Assignment reads. Server Components authorize before repository access; pure contracts create token-free IDs, safe Storage context, raw-date classifications, quality warnings, and formula-safe metadata export. Browser-native PDF preview receives the usable URL only after authorization.
