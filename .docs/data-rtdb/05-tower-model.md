# Tower model

The Tower record is `tower/{towerPushKey}`. `tower_id` is the business key. Web detail addresses the push key; Assignment and Cell relations use `tower_id` (`firebase-tower-repository.ts:30-57`; `firebase-tower-workspace-repository.ts:16-27`).

The read contract preserves legacy scalars. Web create/import normalize approved input; edit supports changed-field updates and null removal. Radio fields proven across code/docs are `g900`, `g1800`, `u900`, `u2100`, `l900`, `l1800`, `l2100`, with `u850`, `l850`, and `l2300` also observed. Stored numbers, numeric strings, null, and absence are permitted by read contracts; decimals are allowed by the generic edit boundary. Production prevalence is Unknown.

`radaba_status` is an operational participation flag: mobile finish writes `Yes` and related region/sub-region composites (`mobile-assignment-finish-service.mjs:214-219`). It is not archive state.
