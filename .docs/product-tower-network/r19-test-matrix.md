# R19 Test Matrix

## Evidence already covered

- Tower mapper preserves number/scalar values and zero.
- Tower edit/import preserve zero and reject out-of-range values.
- Assignment creation copies Tower fields.
- Mobile reads return raw Assignment data.
- Mobile image/finish flows iterate band sector counts.
- Tower audit excludes unchanged zero and records actual changes.
- Finished workflow and reports have existing regression suites.

## Required before runtime R19

- integer-only network validation, null, numeric-string, negative, decimal, and approved maximum;
- exact difference detection including zero versus null;
- Tower compare-and-set conflict and required reason;
- every proven/unknown status eligibility case;
- Assignment/Tower identity and exact snapshot conflicts;
- unrelated field preservation and partial result reporting;
- immutable historical Assignment/report tests;
- Android source-level DTO/cache/refresh tests;
- device/emulator increase/decrease scenarios;
- mobile image, Cell, pause, resume, finish, and report regression;
- authorization, responsive UI, errors, build, route manifest, diff check, and secret scan.

No R19 runtime tests were added because runtime implementation is blocked.
