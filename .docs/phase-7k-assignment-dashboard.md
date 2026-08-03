# Phase 7K: Assignment Dashboard and Analytics

## Scope

Phase 7K adds a read-only operational dashboard at `/home/assignment/dashboard`. It derives workload, progress, completion, revisit, category, Coordinator, and Rigger analytics from existing Assignment records. It introduces no Assignment write, workflow change, business-rule change, required field, migration, aggregate node, or cache.

## Query and filtering

The dashboard defaults to Last 30 Days and queries `assignment` by the existing `created_date` field. Custom ranges are limited to 366 days and processing is capped at 5,000 records. Exact over-limit results require narrower filters. Coordinator, Rigger, category, status, and bounded keyword matching are applied server-side to the selected cohort.

Keyword matching covers Assignment ID, Tower ID, site name, description, Coordinator, and Rigger. Person analytics use the currently stored assignee because no compatible reassignment history exists.

## Metrics

The selected created-date cohort provides current status counts, completed-today/week/month counts, revisited Assignment count, completion time, response time, active Assignment age, daily creation/completion trends, weekly/monthly completion rollups, and grouped person/category analytics.

Durations exclude missing, invalid, negative, or incomplete timestamp pairs. Average Pause Duration is deliberately unavailable because the existing schema stores a pause timestamp but no Resume timestamp or complete pause interval history.

`Revisited` counts Assignments whose `revisit_count` is greater than zero. Completion metrics use the shared legacy-compatible completion predicate.

## Recent activity

Latest Assignments, completions, and revisits reuse their existing record timestamps. Latest comments and photo uploads are a clearly labelled bounded sample: the repository checks at most the 12 newest filtered Assignment threads and reads at most one comment and one photo from each. RTDB has no collection-group query across the nested paths, and this read-only milestone does not add a denormalized activity index.

## Presentation and accessibility

The responsive dashboard uses summary cards, native SVG/CSS line, bar, and doughnut charts, current-attribution Coordinator/Rigger tables, and recent-activity lists. Charts are lazy-loaded and are visual enhancements to adjacent accessible data tables. SVGs provide labels and titles, colors use strong contrast, interactive controls have visible focus, mobile sections stack, and workload tables use native collapsible details.

## Security and compatibility

The server page resolves the existing revocation-aware session and strict `/assignment` privilege before constructing the dashboard repository. Current Radaba has no separate row-level hidden-Assignment contract, so the dashboard preserves the same visibility boundary as the Assignment list.

The repository performs only bounded Firebase Admin reads. Existing Assignment, Photo Evidence, Discussion, Timeline, workflow, Android compatibility, and notifications are unchanged.
