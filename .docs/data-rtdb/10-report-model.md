# Report model

There is no separate report RTDB node. Current report metadata is embedded in Assignment fields `report_name` and `report_url`; the PDF is a Firebase Storage object under the legacy `report/` prefix. R17 derives deterministic web IDs from Assignment push key and URL and performs bounded read-only Assignment queries (`firebase-report-repository.ts:17-20`).

Mobile finish writes report fields while closing the Assignment (`mobile-assignment-finish-service.mjs:89-121,232-238`). Binary upload and RTDB finish are separate and non-atomic. One current report pair per Assignment is modeled; replacement/history/deletion policy is absent.
