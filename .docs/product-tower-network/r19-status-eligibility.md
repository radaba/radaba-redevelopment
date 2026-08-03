# R19 Status Eligibility

## Proven statuses

- Active workflow states: `Open`, `Accepted`, `On Progress`, `Paused`.
- Terminal states: `Finished`, `Rejected`, `Dropped`.
- Terminal status representations also include `Closed` and `Completed`, plus compatibility completion evidence.
- Revisit is an action that restores `On Progress` / `Open`; it is not a persisted state.

## R19 synchronization policy

No status is currently approved for synchronization because Android mid-work refresh behavior is unresolved. Every attempted future synchronization must deny terminal/completed evidence, skip unknown status combinations, and re-evaluate status inside the write transaction. `Assigned`, `In Progress`, `Cancelled`, and `Archived` must not be invented as aliases.
