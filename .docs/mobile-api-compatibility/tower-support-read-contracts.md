# Tower-support read contracts

No dedicated legacy mobile Tower-support read route remained safe and proven.
Tower values used by Cell screens (`tower_id`, `tower_height`) are embedded in
Cell records and remain pass-through fields. `getCatalogs` contains a
`tower_type` catalog, but was deferred because its source is untracked and its
deployed contract is uncertain. No Tower repository operation was added in M6R.
