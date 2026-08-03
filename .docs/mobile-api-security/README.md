# Mobile API security hardening

Phase M11R adds a centralized, route-aware policy layer to the 15 compatibility endpoints without changing their paths or successful DTOs. Runtime modes are `legacy-compatible` (default), `observe`, and `enforce`. Production enforcement is deliberately rejected in M11R.

This folder is the security decision record. Start with the route matrix and policy, then identity/RBAC, compatibility impact, replay analysis, threat model, tests, and rollout plan. No database schema, dependency, Android, legacy, or deployment change is part of this phase.