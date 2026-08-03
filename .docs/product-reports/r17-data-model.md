# R17 data model

`AorReportRecord` is a server-only display model derived from one Assignment child. It preserves
the source Assignment key, business identifiers, people and location metadata, raw dates,
tokenized URL for authorized actions only, safe Storage context, quality status, and warnings.
It is never persisted.
