# Cell and sector field matrix

All fields below are pass-through values from RTDB node `cell`; the compatibility
layer does not supply defaults or coerce types. Android declares them as strings,
but RTDB fixtures prove mixed values remain possible.

| Legacy field | Android serialized field | Observed/fixture behavior | Android use |
| --- | --- | --- | --- |
| `rru_type` | `rru_type` | string; optional | display/edit |
| `tower_id` | `tower_id` | string; optional | identity/context |
| `assignment_id` | `assignment_id` | string; relationship | request context |
| `rcell_id` | `rcell_id` | string; exact query identity | Cell identity |
| `sector` | `sector` | numeric string | filtering/report layout |
| `band` | `band` | lower-case token string | filtering/report layout |
| `antenna_height`, `antenna_height_after` | same | numeric strings; optional | report/edit |
| `tower_height` | same | numeric string; optional | report label |
| `antenna_type` | same | string; optional | report/edit |
| `azimuth_before`, `azimuth_after` | same | string normally; zero and empty preserved | report/edit |
| `mechanical_tilt_before`, `mechanical_tilt_after` | same | numeric strings | report/edit |
| `electrical_tilt_before`, `electrical_tilt_after` | same | numeric strings | report/edit |
| `bracket_tilt_before`, `bracket_tilt_after` | same | numeric strings | DTO |
| `antenna_port_in_use`, `antenna_port_aisg_cable`, `antenna_port_quantity`, `antenna_port_note` | same | strings; note may be empty/null | DTO/report |
| `antenna_serial_number`, `rru_serial_number` | same | strings; optional | DTO |
| `site_id`, `site_db_id`, `sitename` | same | strings; optional | context |

Legacy source also proves `closed_date` and `closed_datetime` can exist on
partial Cell records, although the current Android DTO does not declare them.
No dedicated technology, frequency, PCI, coordinates, vendor, status, remarks,
or created/updated fields are proven; none were added. Sector identity is carried
by `sector` and encoded in `rcell_id`; there is no separate sector node.
