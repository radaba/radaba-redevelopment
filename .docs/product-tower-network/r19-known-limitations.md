# R19 Known Limitations

- Android refresh/resync behavior is unconfirmed; this blocks Assignment synchronization.
- No reliable online/offline signal exists.
- No general Assignment version protects band fields.
- Existing Tower edit accepts decimals even though sector counts should be integers; R19 must use a stricter boundary.
- The existing 0–999 bound is not a proven operational maximum.
- Count-decrease handling for existing Cell/image evidence is undecided.
- Existing Tower audit has no required reason or synchronization-result shape.
- Existing Tower editing is administrator-only; Coordinator scope is unproven.
- Reports do not currently consume these band fields, but completed Assignment records must remain immutable.
- No production/staging data or device validation was used.
