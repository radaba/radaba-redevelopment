# Normalization

The canonical view is read-only and includes source identity, module, raw and friendly action, derived severity, target, actor, normalized timestamp plus raw timestamp, reason, changed fields, before/after, redacted metadata, result, and malformed status.

Timestamps accept epoch seconds, epoch milliseconds, and parseable strings. Invalid values remain invalid and are never replaced with the current time. Unknown or malformed records remain visible with a data-quality warning.