# M9R-D state transition map

The compatibility endpoint does not enforce a source-state state machine. Any stored state can be overwritten by any supported requested state.

`* -> Paused | Rejected | Dropped | On Progress | Finished`

Consequences: resume is accepted when not paused; pause after reject can create an Open composite while `assignment_status` remains Closed; later transitions retain fields they do not explicitly clear. These are compatibility facts, not recommendations.
