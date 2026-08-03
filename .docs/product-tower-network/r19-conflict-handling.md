# R19 Conflict Handling

No reliable version or online-presence signal exists. Future conflict checks therefore require exact compare-before-write for all reviewed band fields, Tower identity, and status. Any mismatch is a conflict; do not merge silently.

An In Progress or Paused Assignment must carry a strong stale-device warning. The UI must not claim online/offline status. Decreasing sector counts requires an explicit product decision for existing Cell/image evidence and is blocked until then.
