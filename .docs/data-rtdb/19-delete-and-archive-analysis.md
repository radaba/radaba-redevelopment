# Delete and archive analysis

Tower hard delete is **Unproven/Unsafe**. Dependency discovery uses bounded related-Assignment, Cell, image/report views and dynamic embedded metadata. There is no exhaustive reverse index, complete production path inventory, or deletion audit contract. Historical and indirect relationships cannot be proven absent.

No approved Tower archive/inactive/deleted field exists. `radaba_status` is written by mobile finish and must not be repurposed (`mobile-assignment-finish-service.mjs:214-229`). Assignment photo/comment deletion exists only for those scoped features. No Tower/Assignment/Cell/image/report hard-delete implementation should be inferred.
