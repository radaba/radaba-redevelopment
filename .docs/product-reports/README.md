# Reports Center

`/home/reports-center` is the authorization-aware workspace for bounded cross-module previews and CSV exports. It does not replace `/home/reports`, which remains the AOR document list and viewer.

The workflow is select type, configure filters, select allowlisted columns, preview, then export. The server independently validates type, access, filters, fields, scope, and limits. No client-supplied rows are accepted.

Reports Center adds no RTDB root, index, required field, PDF generation, scheduled delivery, or shared preset storage. Successful exports are recorded through the existing append-only `administrator_audit` writer; file content is never audited or stored.
