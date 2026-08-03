# M9R-D security exposure matrix

| Surface | Exposure |
|---|---|
| Firebase Auth | None added |
| Firebase Storage | None added |
| RTDB | Existing Admin SDK lifecycle paths only |
| Credentials/secrets | Never logged or fixture-backed |
| Request data | Legacy fields accepted; no new field |
| Error data | Legacy raw failure message retained |

Raw error detail is a compatibility exposure and should be reconsidered only in a separately approved contract-breaking phase.
