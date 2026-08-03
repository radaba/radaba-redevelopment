# R15C sector-band grouping

Cells sort by numeric sector when possible, then lexical sector, then a stable radio-band
order (`G`, `U`, `L`, other; numeric frequency), then database key. Missing sectors and bands
use explicit `Unspecified` groups. Records are never merged: duplicate sector-band pairs and
duplicate `rcell_id` values remain separate rows and produce warnings.
