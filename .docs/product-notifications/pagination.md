# Pagination and unread count

Feeds use Firebase push-key newest-first cursor pagination, capped at 100 repository records and 25 on the page. The shell loads seven preview items. Unread count uses `orderByChild("read").equalTo(false).limitToLast(101)` and displays at most `99+`; it is explicitly bounded rather than denormalized. Mark-all-read affects at most 100 records per request and reports whether the bound was reached.

No retention deletion runs. A future reviewed policy may retain 90 days, archive older records, and preserve critical notifications longer.

The unread operation reads the newest bounded push-key window and filters ead !== true server-side. This avoids an undeclared ead index warning. Because this repository contains no RTDB rules file and deployed authorization rules are unknown, no partial rules file was created or deployed; doing so could replace existing security rules. The unread count and mark-all operation therefore describe only the newest bounded window.
