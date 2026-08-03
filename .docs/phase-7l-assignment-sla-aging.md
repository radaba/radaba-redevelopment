# Phase 7L — Assignment SLA, Aging & Escalation

## Scope

Phase 7L adds read-only SLA, aging, and escalation-readiness views over existing
Assignment records. It does not write Assignment data, alter workflow transitions,
send notifications, or introduce scheduled jobs.

## Central SLA contract

The single source of configuration is
`src/features/assignment/assignment-sla-contract.mjs`.

| Active status | Target |
| --- | ---: |
| Open | 24 hours |
| Accepted | 12 hours |
| On Progress | 72 hours |
| Paused | 24 hours |

Warning begins at 75% of the applicable target. An active Assignment is overdue
after its target. It is escalation-ready when any of these conditions is true:

- overdue by at least 24 hours;
- paused for at least 24 hours;
- revisit count is at least two.

Escalation readiness is an indicator only. No notification is sent.

## Formulas

- Assignment age: created timestamp to now for active records, or created
  timestamp to the available terminal timestamp for terminal records.
- Current status age: current status-entry timestamp to now.
- Working duration: check-in to now/terminal time when no pause exists, or
  check-in to pause time while currently paused.
- Pause duration: pause timestamp to now only while currently Paused.
- Time since last activity: now minus the latest available lifecycle, revisit,
  checklist-update, or report-update timestamp.
- Aging buckets: 0–1, 2–3, 4–7, 8–14, and 15+ elapsed days.

Negative or missing durations are unavailable rather than inferred.

## Status timestamp selection

- Open uses `created_datetime` (then `created_date`).
- Accepted uses `accepted_datetime` (then `accepted_date`).
- Paused uses `paused_datetime` (then `paused_date`).
- On Progress uses check-in, or a later revisit timestamp where available.
- A resumed On Progress record whose pause is later than check-in and which has
  no later revisit timestamp is `Unavailable`; the database has no resume timestamp.
- Finished, Rejected, and Dropped are `Not Applicable`.

## Timezone assumption

Legacy wall-time strings are parsed by their numeric date/time components. This
matches the existing Jakarta-oriented dashboard behavior and prevents the host
machine timezone from changing elapsed-time results. These timestamps are treated
as a consistent wall-clock scale, not converted from a stored timezone offset.

## Integration and performance

- Dashboard calculations reuse the bounded dashboard read and expose SLA status
  totals plus aging-bucket totals.
- The Assignment list evaluates optional SLA and aging filters before pagination
  of its already date-bounded query result.
- List rows/cards expose text SLA badges and aging.
- Assignment detail exposes target, remaining/overdue time, durations, escalation
  reasons, and known limitations.
- Existing Assignment permission gates remain authoritative.

## Known limitations

- Resume timestamps are not stored, so resumed status age, total working duration,
  and historical pause duration cannot always be calculated.
- Comments and photos live in separate nodes; they are not included in per-row
  last-activity calculations. Dashboard activity continues using its bounded
  nested-node sample.
- SLA configuration has no administration UI in this phase.
- SLA values are calculated at read time and are not persisted.
