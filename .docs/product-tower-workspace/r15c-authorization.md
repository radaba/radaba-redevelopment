# R15C authorization

The server page resolves the revocation-aware session and requires an Active user with strict
existing `/assignment` privilege before constructing the workspace. No browser Firebase read
or role supplied by the client is trusted. This matches the current Tower directory boundary;
object-level coordinator/rigger scoping is not added because the established web Tower policy
does not define it.
