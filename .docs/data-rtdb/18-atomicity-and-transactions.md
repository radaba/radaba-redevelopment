# Atomicity and transactions

| Workflow                               | Writes                                       | Atomic?       | Failure mode                         | Recovery                         |
| -------------------------------------- | -------------------------------------------- | ------------- | ------------------------------------ | -------------------------------- |
| Tower create/edit/import + audit       | Tower + `tower_audit` root transaction       | Yes           | transaction abort                    | retry                            |
| Assignment create                      | one set; bulk root update                    | Per operation | partial across external steps        | retry/manual                     |
| Web lifecycle/checklist/report/revisit | one Assignment transaction                   | Yes           | stale/invalid abort                  | refresh                          |
| Cell upsert                            | query then multiple updates/push             | No            | duplicates/partial duplicate updates | retry may repeat                 |
| Image binary + metadata                | Storage then RTDB/API                        | No            | orphan or missing metadata           | manual/retry                     |
| Web photo create/delete                | Storage and RTDB separate                    | No            | orphan/missing object                | compensation attempted on create |
| Mobile finish/report                   | Cell→image→Tower→user→Assignment→achievement | No            | cross-domain partial close           | no transaction rollback          |
| Administrator mutation + audit         | domain write then best-effort audit          | No            | unaudited mutation                   | logging only                     |

No general revision/ETag exists. Selected Assignment web operations use transaction-based revisions; mobile patches are last-write-wins.
