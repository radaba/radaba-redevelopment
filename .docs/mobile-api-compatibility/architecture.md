# Architecture

App Router route adapters delegate to dependency-free compatibility handlers.
Handlers use legacy request/response and Jakarta-time adapters. Firebase access
is behind operation-specific repositories; tests inject fakes.

```text
src/app/api/mobile/<legacy-name>/route.ts
  -> src/server/mobile-api/routes
  -> compatibility adapters
  -> operation-specific repository
  -> Firebase Admin RTDB
```

Authentication and authorization modules are non-enforcing skeletons. The v1
layer does not use the redevelopment standard response envelope because that
would break Android compatibility.

Method quirks are preserved by exporting the same handler for GET, POST, PUT,
PATCH, DELETE, OPTIONS, and HEAD. CONNECT/TRACE and platform-level HEAD body
handling remain framework limitations.

## M9R-B transition slice

A supported-state fence permits only Paused, Rejected, Dropped, and On Progress. The operation-specific repository exposes Assignment/user reads and one Assignment update.


## M10R Cell command boundary

updateCellDetails uses a dedicated handler, command service, and Cell-only repository. Sector identity is represented by rcell_id inside the existing Cell node; no generic CRUD or Sector repository was introduced.
