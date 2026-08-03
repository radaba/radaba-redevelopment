# Mobile API v1 compatibility

Phases M4R and M5R establish `/api/mobile/*` compatibility routes in
`radaba-redevelopment`. The legacy repository is read-only and remains the v1
contract authority.

Implemented:

- `/api/mobile/getRejectDropReasonList`
- `/api/mobile/getCurrentTime`
- `/api/mobile/getCellDetails`
- `/api/mobile/getassignmentsById`
- `/api/mobile/getImageDetails`
- `/api/mobile/getAorSummaryById`
- `/api/mobile/getCellDetailsPerSector`
- `/api/mobile/getUtility`
- `/api/mobile/signin`
- `/api/mobile/signout`
- `/api/mobile/resetPassword`
- `/api/mobile/updateUserDetails`
- `/api/mobile/updateImageDetails`

All other legacy routes are deferred. No Android cutover or deployment has
occurred.

See [architecture](architecture.md), [route mapping](route-mapping.md),
[testing](testing.md), the [M4R report](phase-m4r-foundation.md), and the
[M5R report](phase-m5r-assignment-image-reads.md).

M6R adds the bounded sector and utility reads. See the
[M6R report](phase-m6r-cell-sector-reads.md), [route selection](m6r-route-selection.md),
and [App Router parity review](app-router-parity.md).

M7R authentication/profile behavior is documented in the
[M7R report](phase-m7r-authentication.md).

M8R image metadata writes are documented in the
[M8R report](phase-m8r-image-writes.md).

## M9R-B

Implemented /api/mobile/updateAssignmentDetails for Paused, Rejected, Dropped, and On Progress only. See [M9R-B](phase-m9r-b.md). Finish/close and broad updates remain deferred.


## M9R-C

The Android-proven Finished branch of updateAssignmentDetails is implemented. See [M9R-C](phase-m9r-c-finish-close.md). Close-by-ID remains deferred.


## M9R-D

Lifecycle parity, replay, failure, recovery, invariant, path, timestamp, concurrency, security, performance, and readiness evidence is consolidated in [Phase M9R-D](phase-m9r-d-consolidation.md). No runtime route changed.

## M10R

Implemented /api/mobile/updateCellDetails, the single Android-proven Cell/Sector upsert route. See [M10R](phase-m10r-cell-sector-writes.md). No separate Sector route or node exists.

## Phase M11R

The compatibility surface now includes a central route-aware security layer with legacy-compatible, observe, and enforce modes. See ../mobile-api-security/README.md. Enforcement remains disabled for production and Android migration is deferred.
