# Denormalization and snapshots

| Field                | Source of truth        | Copies                                 | Copy time           | Later sync?          | Drift risk |
| -------------------- | ---------------------- | -------------------------------------- | ------------------- | -------------------- | ---------- |
| `tower_id`           | Tower identity         | Assignment, Cell, image/report context | creation/write      | no general sync      | High       |
| site/location/region | Tower current          | Assignment snapshot                    | Assignment creation | no                   | High       |
| rigger/coordinator   | Assignment/user        | Assignment composites/achievement      | assign/finish       | selective            | Medium     |
| radio counts         | Tower current          | Assignment snapshot                    | Assignment creation | none approved        | High       |
| report identifiers   | Assignment             | Storage object reference               | finish              | replacement possible | High       |
| image metadata       | Cell/Tower/image nodes | Storage object                         | upload              | patch/upsert         | High       |

Tower is current configuration; Assignment is a creation-time snapshot. Readers do not dynamically join Tower radio values into Assignment. Drift is intentional for historical work and unsafe to “repair” without versioned coordination.
