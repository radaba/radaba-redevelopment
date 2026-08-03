# R15A image key parser

The extractor accepts only fields matching `foto_[a-z0-9_]+_(name|url)`.
It derives the exact base field and companion key and creates a reference even
when one side is absent. Other `_url` fields are ignored.

Known category prefixes are matched longest-first, including Rigger Body
Harness, WAH Certificate Rigger, Tower Height, RRU Serial Number, RRU Type,
Antenna, Antenna Serial Number, Azimuth, Mechanical Tilt, Electrical Tilt,
Site Overview, Tower, Sector, GPS, Before, and After. Unknown keys retain their
field key and receive an `Unclassified:` fallback label.

Only the tested terminal pattern `_sector_<number>_<letter><number>` supplies
sector/band metadata. Explicit Cell `sector` and `band` values take priority.
Assignment IDs are never parsed by underscore splitting.

Assignment and Cell evidence views use the extractor directly from their
captured records. The standalone Images routes and their synthetic image-detail
identifiers have been removed.
