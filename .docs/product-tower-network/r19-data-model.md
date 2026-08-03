# R19 Data Model

## Read-time model

A future pure model may expose the exact fields below as nullable normalized integers while retaining raw values for warnings. It must not be persisted as a new object.

| Field | Label | Meaning |
|---|---|---|
| `g900` | GSM 900 | sector count |
| `g1800` | GSM 1800 | sector count |
| `u900` | UMTS 900 | sector count |
| `u2100` | UMTS 2100 | sector count |
| `l900` | LTE 900 | sector count |
| `l1800` | LTE 1800 | sector count |
| `l2100` | LTE 2100 | sector count |

Tower also carries `u850`, `l850`, and `l2300`; inclusion in a future UI must follow the actual Tower/Assignment/mobile contract rather than silently dropping them.

A difference is derived from exact field/value pairs and is never persisted. `0` differs from null. Invalid legacy strings produce a warning and are not silently coerced for writes.
