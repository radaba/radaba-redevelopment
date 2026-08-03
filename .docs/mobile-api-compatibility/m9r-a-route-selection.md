# Phase M9R-A route selection

## Decision

Phase M9R-A implements **zero routes**.

No legacy Assignment write endpoint can be reproduced as a whole while staying
inside the approved low-risk lifecycle boundary. Adding a partially compatible
replacement under an existing legacy route name would be misleading and would
create an Android compatibility regression for the omitted request branches.

This is the safe-stop outcome explicitly allowed by the M9R-A scope.

## Sources reviewed

- Legacy Cloud Function:
  `D:\next\radaba\sufyandev_backup - Copy\src\pages\api\mobile\updateAssignmentDetails.js`
- Legacy close function:
  `D:\next\radaba\sufyandev_backup - Copy\src\pages\api\mobile\updateAssignmentToClosedByID.js`
- Existing workflow inventory:
  `.docs/mobile-api/assignment-workflow.md`
- Existing mobile compatibility route and contract tests under:
  `src/app/api/mobile` and `tests/mobile-api`

The legacy project was inspected read-only.

## Candidate inventory

| Legacy route | Candidate low-risk behavior | Disqualifying behavior in the same route | M9R-A result |
| --- | --- | --- | --- |
| `updateAssignmentDetails` | Assignment acceptance/start/check-in style lifecycle updates may contain individually low-risk branches | The same public contract also dispatches pause, reject, drop, resume, finish, and broad update behavior. Its branches can write Assignment plus user, Cell, image, Tower, and achievement-related data. These behaviors cross the M9R-A boundary and include work reserved for M9R-B/M9R-C or otherwise excluded from this phase. | Deferred as a whole |
| `updateAssignmentToClosedByID` | None within M9R-A | This is a finish/close workflow with metrics and fan-out behavior. Finish/close is reserved for M9R-C. | Deferred to M9R-C |

No third legacy Assignment lifecycle write endpoint was identified that provides
an independently callable, low-risk route contract.

## Why a partial `updateAssignmentDetails` route is unsafe

The compatibility unit is the externally visible legacy endpoint, not an
internal branch selected from that endpoint. Android callers address
`updateAssignmentDetails` and supply request data that selects lifecycle
behavior. A Next.js route with that name but only a subset of the legacy
branches would have one of three unsafe outcomes:

1. silently accept unsupported lifecycle requests;
2. return a new error shape/status that the legacy client does not expect; or
3. accidentally make an excluded branch reachable through shared fallback
   behavior.

Splitting only the low-risk branches into new route names would not preserve the
legacy Android contract. Implementing the whole legacy route would exceed the
approved M9R-A write surface. Neither option is authorized.

## Boundary retained

This decision introduces:

- no API route;
- no Firebase write;
- no database path or field change;
- no new request or response contract;
- no dependency or lockfile change;
- no Android or legacy-project modification; and
- no M9R-B, M9R-C, or M9R-D behavior.

## Revisit condition

Implementation can resume only after a later phase authorizes the complete
branch surface of `updateAssignmentDetails`, or after an explicit compatibility
decision defines a safely rejectable subset (including exact Android-observed
status, body, and side-effect behavior). The close route remains a separate
M9R-C concern.
