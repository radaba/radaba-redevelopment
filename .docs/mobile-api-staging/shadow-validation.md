# M12R shadow validation

The shadow run is deterministic and local: legacy golden fixtures and operation logs are replayed against redevelopment handlers with fake repositories. Comparison covers HTTP/envelopes, DTO fields, read queries/order, write paths/payloads/order, error asymmetry, replay, and partial failure. It does not send duplicate writes to either live backend.

Validated scenarios: login, Assignment detail, Pause, Resume, Reject, Drop, Finish, Tower/image read, Cell read, Cell/Sector update, image metadata update, and idempotent logout handler. Accept, Check-in/Go, closeByID, active-upload lists, and catalogs remain blocked/deferred exactly as recorded in M9R-D and the matrix.

Legacy-compatible and observe preserve successful and failure DTO behavior. Enforce blocks violations with safe legacy envelopes; this is an intentional parity difference. Timing assumptions remain sequential where the legacy workflow is sequential. No live latency, network interruption, or Firebase permission result is claimed without a staging target.