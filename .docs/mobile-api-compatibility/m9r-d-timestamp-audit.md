# M9R-D timestamp audit

Legacy-formatted `curr_date`, `curr_datetime`, compact date, and sequence seconds are generated once per service call. Replay generates new values. Paused writes pause fields; Rejected writes close fields; Dropped writes matching close and site fields; On Progress writes no standalone timestamp; Finished writes close fields and uses the same time snapshot across its fan-out.

No timezone conversion, server timestamp substitution, or field normalization was introduced.
