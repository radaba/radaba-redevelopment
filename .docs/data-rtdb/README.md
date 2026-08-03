# Investigation 5 — Firebase Realtime Database

Status: documentation-only static reverse engineering. No Firebase data, rules, deployment, migration, or production environment was accessed.

## Baseline and scope

- Redevelopment: branch `feature/login-redesign`, commit `14744d2c3f1dd7cc7a8107ae9d789a20719f326c`, heavily dirty before this investigation.
- Legacy reference: branch `refactor/codebase-cleanup`, commit `496a8fcd182424971cfb7ffa903718070cf2a548`, also dirty and read-only.
- Runtime database access uses the Firebase Admin SDK singleton from `src/lib/firebase/admin.ts:10-27`. Browser Firebase initializes Authentication only (`src/lib/firebase/client.ts:1-41`).
- The available repository has no RTDB rules file or RTDB emulator configuration. `firebase.json` configures Storage rules only.
- Static fixtures exist, but no sanitized RTDB export was found. Actual data prevalence is **Unknown**.

## Principal conclusions

The redevelopment proves these active top-level paths: `tower`, `tower_audit`, `assignment`, `assignment_comment`, `assignment_photo`, `cell`, `image`, `user`, `privilege`, `log`, `utility`, `category`, `achievement`, and `administrator_audit`. This is a proven implementation inventory, not proof that production has no additional legacy nodes. Legacy constants also name `pre_process`, `rcell`, `file`, `test`, `off_day`, `rank`, `badspot`, `visit`, and `user_test`; their current production relevance is not established (`legacy functions/util/config.js:23-41`).

Tower, Assignment, Cell, image, user, privilege, and audit collections use Firebase push keys. Business identifiers remain fields: `tower_id`, `assignment_id`, and `rcell_id`. Cell commands query `cell` by `rcell_id`, update every match, and push when no match exists (`src/server/mobile-api/repositories/firebase-mobile-cell-command-repository.ts:23-38`); this preserves Android upsert behavior but does not enforce uniqueness.

Tower create/edit/import and `tower_audit/{towerKey}/{auditKey}` are committed in one root transaction (`src/server/tower/firebase-tower-command-repository.ts:14-17`). Assignment creation copies a Tower snapshot (`src/server/assignment/firebase-assignment-command-repository.ts:54-118` and `src/features/assignment/assignment-command-service.ts`), but legacy/mobile finish is a sequential fan-out across Cell, image, Tower, user, Assignment, and achievement (`src/server/mobile-api/services/mobile-assignment-finish-service.mjs:190-238`), so it is not atomic.

The radio fields `g900`, `g1800`, `u900`, `u2100`, `l900`, `l1800`, `l2100`, plus observed `l850` and `l2300`, are legacy scalars. Read models preserve number/string/null/absence, but mobile finish uses `Number(value || 0)`, collapsing null/absence/empty string to zero for loop execution (`mobile-assignment-finish-service.mjs:1-4,206-213`). Therefore storage can distinguish zero from unknown, but every consumer does not.

Completed Assignment immutability is enforced by selected web transactions, not universally. The mobile update repository can patch completed records, and revisit intentionally reopens completed records. Immutability is therefore **not proven as a system-wide invariant**.

## Mandatory safety conclusions

| Question                                         | Conclusion       | Basis                                                                                                 |
| ------------------------------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------- |
| Complete RTDB path inventory proven?             | NOT PROVEN       | Static active paths are mapped; production and legacy-only paths were not enumerated from data/rules. |
| Cell key strategy proven?                        | PROVEN           | Push key plus child `rcell_id`; equality-query upsert updates all matches or pushes.                  |
| Distinguish zero from unknown radio counts?      | PARTIALLY PROVEN | Raw storage/mappers can; mobile finish coercion cannot.                                               |
| Tower writes atomic with audit?                  | PROVEN           | Root transactions cover current create/edit/import writers.                                           |
| Assignment snapshots immutable after completion? | NOT PROVEN       | Some web commands reject completion; mobile patch/revisit paths remain mutable.                       |
| Tower dependencies enumerable completely?        | NOT PROVEN       | Bounded windows and indirect/dynamic image relations prevent completeness.                            |
| Tower hard delete safe today?                    | NOT PROVEN       | No complete reverse index or exhaustive dependency proof.                                             |
| Archive lifecycle field exists?                  | NOT PROVEN       | No approved archive field; `radaba_status` is operational.                                            |
| Mobile API contracts fully mapped?               | PARTIALLY PROVEN | Implemented App Router routes mapped; deferred legacy routes remain.                                  |
| Production-data validation required?             | PROVEN           | No production/sanitized complete export was inspected.                                                |

## Documents

The numbered files in this directory cover initialization, paths, schemas, ownership, lifecycle, queries, atomicity, compatibility, evidence, known unknowns, and recommended validation milestones.
