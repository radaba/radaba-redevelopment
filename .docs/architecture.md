# Radaba Architecture

## Current target architecture

```text
Browser
   |
   v
Next.js App Router
   |
   +-- Client Components
   |     - login form
   |     - page interactions
   |     - client state
   |
   +-- Route Handlers
   |     - login API
   |     - password reset API
   |     - logout API
   |
   +-- Server-only Services
   |     - Firebase Authentication integration
   |     - Realtime Database user lookup
   |     - privilege lookup
   |     - session-cookie handling
   |
   +-- Firebase
         - Authentication
         - Realtime Database
         - Hosting / deployment infrastructure
