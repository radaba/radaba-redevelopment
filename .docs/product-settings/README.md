# System Settings

`/home/settings` is a strict-administrator, read-only inventory of global Radaba configuration and operational status. It replaces the former authenticated personal-preferences placeholder. Personal preferences remain out of scope.

No approved `system_settings` RTDB root, mutable repository, or central feature-flag mechanism exists. Consequently this milestone creates no mutation API, database path, save action, concurrency token, or settings audit event. Introducing runtime configuration requires separate schema and enforcement approval, including Android compatibility.
