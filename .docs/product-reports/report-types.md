# Report types

| Type | Source | Required exact privilege | Scope |
|---|---|---|---|
| Assignment | `assignment` | `/assignment` | newest 500 |
| Tower | `tower` | `/towers` | newest 500 |
| Cell | `cell` | `/cells` | newest 500 |
| Rigger performance | `user` + `assignment` | `/riggers` | newest 500 of each |
| User administration | `user` | strict administrator + `/users` | newest 500 |
| Audit | existing audit roots | strict administrator + `/audit` | bounded source windows |
| AOR index | Assignment-derived AOR metadata | `/reports` | newest 500 Assignments |

Rigger totals count unique Assignment records, never Cell or Image rows. Completion rate is `completed assignments / total assigned * 100`; unsupported duration averages are omitted. Identity health is `not_checked` because bulk Auth enrichment would create an N+1 pattern.
