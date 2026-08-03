# Phase M9R-D consolidation

M9R-D is an evidence and characterization phase. It adds no route, database field, migration, automatic retry, compensation, or repair behavior.

The implemented lifecycle surface is `/api/mobile/updateAssignmentDetails`: `Paused`, `Rejected`, `Dropped`, `On Progress`, and `Finished`. The first four perform one Assignment update. `Finished` performs the legacy ordered, non-atomic fan-out. Accepted, Checkin, Go, completed, and `updateAssignmentToClosedByID` remain deliberately deferred.

Characterization tests cover transition sequences, replay, injected failures, concurrent requests, write-path exposure, and a machine-readable parity matrix. Existing runtime behavior is preserved, including unsafe replay characteristics.

Decision: migration is not ready for unqualified cutover. A caller must not blindly retry `Finished`; an operator must inspect the partial-state boundary first.
