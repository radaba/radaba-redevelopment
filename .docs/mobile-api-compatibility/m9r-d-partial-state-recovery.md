# M9R-D partial-state recovery

Recovery is observational and manual:

1. Identify the assignment and request time without exposing credentials.
2. Inspect Assignment, cell, image, tower, user, and achievement nodes in legacy operation order.
3. Find the first missing or inconsistent effect.
4. Do not replay `Finished` blindly because achievements may increment twice.
5. Escalate for an explicitly approved repair procedure.

There is no repair script, recovery marker, compensation, or background retry in M9R-D.
