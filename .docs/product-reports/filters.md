# Filters

Each definition declares its accepted filter keys. Unknown filters, malformed ISO dates, overly long values, unknown columns, duplicates, and missing required identifiers are rejected. Matching is case-insensitive for text and inclusive for date ranges. Filters run over the bounded loaded window, so matched counts are not database totals.
