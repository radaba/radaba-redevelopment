# Settings catalog

The executable allowlist is `src/features/settings/system-settings.mjs`. Every visible entry is classified as deployment-managed or read-only. There are currently no runtime-editable entries.

The catalog covers application identity and timezone behavior, protected Assignment policies, web session duration, upload/import limits, in-app notifications, CSV/report protections and limits, unavailable maintenance controls, deployed feature availability, masked integration configuration, application version, environment, and mobile API security mode.

Code constants include a seven-day web session, 5 MiB profile photos, 10 MiB Assignment evidence images, 1 MiB/200-row Assignment imports, 1 MiB/200-row Tower previews, 5,000-row Assignment export, and 75/500-row Reports Center preview/export limits.
