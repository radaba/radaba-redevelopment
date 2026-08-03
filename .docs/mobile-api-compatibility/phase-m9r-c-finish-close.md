# Phase M9R-C: Finished workflow compatibility

M9R-C adds the Android-proven Finished branch to the existing
`updateAssignmentDetails` compatibility route. The separate close-by-ID route
is deferred for incomplete Android contract evidence.

The implementation uses a route-specific finish service and repository. It
preserves sequential related-record fan-out followed by concurrent achievement
transactions, raw errors, missing-record behavior, replay counter increments,
legacy unsafe unauthenticated access, and the plural/singular image-status
defect.

No Cell mutation API, image transport, Storage behavior, photo-card generation,
security enforcement, schema migration, dependency change, Android change, or
deployment is included.

Rollback removes the finish service/repository/fixtures/tests and removes the
Finished dispatch plus constructor wiring from `updateAssignmentDetails`. M9R-B
transitions remain independently usable.

