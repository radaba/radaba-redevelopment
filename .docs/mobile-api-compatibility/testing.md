# Testing

Run:

```powershell
node --test tests/mobile-api/compatibility.test.js tests/mobile-api/assignment-image-reads.test.js tests/mobile-api/cell-support-reads.test.js
```

The 36 tests use sanitized fixtures, fake repositories/Auth, deterministic
clock injection, ordered operation recording, error injection, exact JSON
assertions, method-source assertions, and a local shadow comparator.

Tests never import Firebase Admin through testing modules, make network calls,
or read operational credentials/data. The shadow comparator compares recorded
sanitized status/body pairs only.

After M6R the combined mobile suite contains 61 tests: 36 foundation tests, 15
Assignment/image tests, and 10 Cell/support tests. M6R adds exact query/path,
duplicates, mixed scalar values, repeated/missing input, raw errors, Android DTO,
secret scan, method fallthrough, shadow parity, and no-write coverage.

M7R adds 11 focused authentication/profile tests, bringing the registered mobile
suite to 72 tests.

M8R adds 10 image-write order, replay, failure, DTO, path, and secret tests; the
registered mobile suite is 82 tests.

## M9R-B

M9R-B adds 13 transition contract, Android DTO, replay, exclusion, and per-operation failure-injection tests. The registered mobile suite is 95 tests.


## M9R-C

M9R-C adds 12 Finished contract, fan-out, replay, failure, allowlist, Android, and secret tests. The registered mobile suite is 107 tests.


## M9R-D

M9R-D adds 9 cross-transition, replay, concurrency, failure-classification, write-surface, documentation, and machine-readable parity tests. The registered mobile suite is 116 tests.

## M10R

M10R adds 15 Cell/Sector update, create, duplicate, replay, failure-injection, mixed-value, Android DTO, method, path-boundary, and secret tests. The registered mobile suite is 131 tests.
