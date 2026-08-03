# Authorization

The server derives enabled entities from exact canonical privilege paths for the verified user's role: `/assignment`, `/towers`, `/cells`, `/riggers`, and `/reports`. User search additionally requires strict `super_admin` authorization and enabled `/users`. Direct requests for disabled entities return `unauthorized`; all-entity search omits them without revealing whether hidden records exist. The client receives only the authorized entity list and cannot broaden it.
