# Phase M9R-B: Assignment pause, reject, drop, and resume

## Implemented route

`/api/mobile/updateAssignmentDetails` reproduces the four approved branches of
the legacy request-dispatched endpoint:

| Request state | Result | Assignment fields |
|---|---|---|
| `Paused` | status retained | paused date/datetime, state, Open composite indexes |
| `Rejected` | status `Closed` | reason, closed date/datetime, state/status, Closed indexes |
| `Dropped` | status `Closed` | reason, closed and site timestamps, state/status, Closed indexes |
| `On Progress` | status retained | state and Open composite indexes |

`On Progress` is the legacy resume-like representation. The legacy source does
not validate the prior state or calculate pause duration. Replays overwrite the
same fields with a newly generated timestamp/index suffix; there is no
idempotency marker.

## Route selection

The legacy API and Android expose one PUT endpoint,
`updateAssignmentDetails`, rather than separate route names. Android supplies
the identity/audit query fields and a `JsonObject` body. Pause, reject, and drop
body construction is directly present in Android. `On Progress` exists in the
legacy dispatch and uses the same Retrofit method and
`BaseResponse<AssignmentUpdateStateResponse>` DTO, but no distinct current
Android resume request constructor was found.

Accepted, Checkin, Go/go, Finished, completion, upload, image-category,
optimasi, justifikasi, and broad body updates remain deferred. Finished/close,
Cell, image, Tower, user mutation, metrics, and achievement behavior is absent.

## Exact data flow

```text
request body
  -> supported-state fence
  -> assignment query: orderByChild("assignment_id").equalTo(body.assignment_id)
  -> first matching Assignment
  -> optional user query: orderByChild("email").equalTo(stored rigger_email)
  -> one update at assignment/<first Firebase key>
  -> {code:200,message:"success",data:<exact update object>}
```

The legacy user lookup is retained even though these four branches do not use
the returned user. Query identity uses `body.assignment_id`; index values use
stored Assignment values. Jakarta date/datetime casing and formatting are
preserved.

No matching Assignment returns HTTP 200 with data
`"The assignment not found"`. Firebase and JSON failures return the legacy
HTTP 500 envelope with the raw error message.

## Controlled incompatibility

The original endpoint accepts unrelated and unknown bodies through a broad
Assignment update fallback. M9R-B is not authorized to expose that surface.
Unsupported or excluded states therefore return HTTP 400:

```json
{"code":400,"message":"failed","data":"The assignment state not supported"}
```

This happens before Firebase access. It is the explicit safety boundary that
makes the four-branch compatibility slice possible.

## Replay and failure matrix

| Scenario | Completed operations | Resulting state |
|---|---|---|
| Assignment read fails | none | unchanged; HTTP 500 |
| optional user read fails | Assignment read | unchanged; HTTP 500 |
| Assignment update fails | both reads | unchanged; HTTP 500 |
| duplicate request | both reads and update repeat | latest update wins |
| retry after write failure | failed attempt has no committed write; retry repeats flow | requested state |

There is only one write in every selected branch, so no partial-write state is
possible inside M9R-B. The fake repository injects failure after each operation.

## Android DTO coverage

Retrofit declares PUT `updateAssignmentDetails` with query fields `email`,
`name`, `uid`, `region`, and `sub_region`, plus a JSON body. The response uses
`AssignmentUpdateStateResponse`. Its declared fields—`reason`, `closed_date`,
`assignment_status`, `assignment_state`, and `closed_datetime`—are present when
the selected transition produces them; Gson safely ignores the additional
legacy index and timestamp fields.

## Rollback

Remove:

- `src/app/api/mobile/updateAssignmentDetails`
- the M9R-B route, transition service, transition clock, and repository modules
- the M9R-B fixture and tests

No schema rollback, data migration, dependency rollback, or Android change is
required.
