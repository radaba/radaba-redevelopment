# R17 date normalization

ISO `YYYY-MM-DD` is display-sortable. Numeric slash dates are preserved verbatim because
`6/5/2026` could mean 6 May or June 5. Such values receive `ambiguous-closed-date`; invalid or
missing values receive their own warning. R17 never silently swaps day and month.
