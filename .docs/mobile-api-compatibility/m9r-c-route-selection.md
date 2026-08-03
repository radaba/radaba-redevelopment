# M9R-C route selection

## Inventory

| Route/branch | Method | Intent | Android | Reads | Writes | Replay/partial risk | Decision |
|---|---|---|---|---|---|---|---|
| `updateAssignmentDetails`, `assignment_state=Finished` | Any; Android PUT | Finish with related-record and achievement fan-out | Proven Retrofit call and direct `ReportHelper` body construction; `AssignmentUpdateStateResponse` | Assignment, user, per-sector Cell, image, Tower, user again, productivity rows, rigger achievement | Cell, image, Tower, user, Assignment, productivity transactions, rigger transaction | High: pre-Assignment partial writes; replay increments achievements | Selected |
| `updateAssignmentToClosedByID` | POST/PUT only | Close every duplicate Assignment match, Cells, metrics marker/fan-out, productivity | No current Retrofit declaration or response DTO | Assignment, Cells, marker, metric/productivity rows | Assignment, Cells, marker, fan-out, metric counters, achievements | Critical; parallel duplicate matches and marker error states | Deferred |
| `updateAssignmentDetails`, body `completed` | Any | Upload-completion flag after finish | Generic Retrofit route, but separate completion action/model evidence is mixed with image upload | Assignment, user | Assignment | Medium | Deferred outside selected Finished branch |

## Selected dependency graph

```text
updateAssignmentDetails
  -> Finished branch
  -> assignment equality query
  -> optional rigger user equality query
  -> per configured sector: Cell equality query -> sequential update(s) or push
  -> image equality query -> sequential update(s)
  -> Tower equality query -> sequential update(s)
  -> user equality query -> sequential update(s)
  -> Assignment update
  -> Promise.all
       -> 3 time levels x National/region/company productivity query + transaction
       -> monthly rigger achievement query + transaction
```

The fan-out is data-dependent: `sum(Number(band counts))` Cell upserts, every
matching image/Tower/user record, 3–9 productivity rows depending on stakeholder
membership, and one rigger row.

## Rationale

The Finished branch is selected because its route, exact Android body, response
DTO, paths, helpers, order, keys, replay behavior, and local deterministic test
surface are proven. It invokes no photo-card or image-generation helper.

Close-by-ID is deferred because the inspected current Android interface has no
Retrofit method, request model, or response DTO. Its marker plus parallel
metrics fan-out is source-visible but does not satisfy the prompt's Android
contract requirement.

Unresolved: deployed historical callers for close-by-ID, concurrency outcomes
when multiple duplicate Assignments close together, and Android behavior for
its response. Access-log/app-version evidence is required before selection.

