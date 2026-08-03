# R19 Decision

## Status

**Partially accepted domain decision; runtime synchronization deferred.**

## Accepted

1. `tower` is the current network-configuration source of truth.
2. A new Assignment receives a snapshot copied from Tower using the exact legacy fields.
3. Assignment snapshots remain stable and must never read Tower values dynamically.
4. Completed/closed historical Assignments and their reports remain unchanged.
5. Tower-only changes must remain the safest default and must not update Assignments.
6. Zero is a known sector count; null/absence is unknown.

## Deferred

Manual synchronization to active Assignments is not approved because Android refresh/resync and local-conflict behavior are unconfirmed. Consequently no eligibility set, synchronization endpoint, synchronization UI, new audit fields, or synchronization node is activated.

## Resume criteria

Resume runtime R19 only after all are available:

- authoritative Android `AssignmentData` and screen/repository source;
- evidence of initial load, cache, refresh, retry, and offline behavior;
- device/emulator staging scenarios for count increase and decrease during Open, Accepted, On Progress, and Paused work;
- decision for existing Cell/image data when counts decrease;
- approved integer maximum based on operational constraints (the current 999 bound is technical, not proven practical meaning);
- approved reason/audit shape and authorization scope;
- transaction design reviewed against RTDB volume and root-transaction impact.

## Rollback

This investigation adds documentation only, so rollback is removal of `.docs/product-tower-network`. No data or runtime rollback is needed.
