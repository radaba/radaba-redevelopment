# Read ownership

All redevelopment RTDB reads are server/Admin SDK reads. Auth reads `user`/`privilege`; web Assignment pages read `assignment`, comments, photos, and related data; Tower pages read `tower`, bounded related Assignments/Cells/reports, and `tower_audit`; Cell/image pages read bounded `cell`/`tower`; report pages read bounded Assignment windows; mobile routes read Assignment/Cell/image/Tower/user/privilege/utility/category.

Exact queries are documented in `17-query-and-index-analysis.md`. `limitToFirst/Last`, recent windows, post-filtering, and duplicate-first-result behavior must be treated as incomplete. No public browser RTDB reader was found.
