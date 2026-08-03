"use client";

import { useEffect, useId, useState } from "react";
import type { AssignmentReference } from "@/features/assignment/assignment-command-contract";

export function AssignmentReferenceLookup({
  label,
  endpoint,
  value,
  onChange,
  required = true,
}: {
  label: string;
  endpoint: string;
  value: AssignmentReference | null;
  onChange: (value: AssignmentReference | null) => void;
  required?: boolean;
}) {
  const id = useId(),
    [query, setQuery] = useState(""),
    [rows, setRows] = useState<AssignmentReference[]>([]);
  const [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (value || query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `${endpoint}${endpoint.includes("?") ? "&" : "?"}q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal, credentials: "same-origin" },
        );
        const body = (await response.json()) as { data?: AssignmentReference[]; error?: string };
        if (!response.ok) throw new Error(body.error || "Lookup unavailable.");
        setRows(body.data ?? []);
      } catch (e) {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Lookup unavailable.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [endpoint, query, value]);
  return (
    <div className="relative">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
        {required ? " *" : ""}
      </label>
      {value ? (
        <div className="mt-1.5 flex min-h-11 items-center justify-between rounded-lg border border-slate-300 px-3">
          <span>
            <strong>{value.name}</strong>
            {value.secondary ? (
              <small className="ml-2 text-slate-500">{value.secondary}</small>
            ) : null}
          </span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            className="text-sm font-semibold text-indigo-700"
          >
            Clear
          </button>
        </div>
      ) : (
        <>
          <input
            id={id}
            role="combobox"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setRows([]);
              setError("");
            }}
            autoComplete="off"
            aria-expanded={rows.length > 0}
            aria-controls={`${id}-options`}
            aria-describedby={`${id}-status`}
            className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 focus-visible:ring-2 focus-visible:ring-indigo-500"
            placeholder={`Type at least 2 characters to search ${label.toLowerCase()}`}
          />
          <div id={`${id}-status`} aria-live="polite" className="mt-1 text-xs text-slate-500">
            {loading
              ? "Searching…"
              : error ||
                (!loading && query.trim().length >= 2 && !rows.length ? "No results." : "")}
          </div>
          {rows.length ? (
            <ul
              id={`${id}-options`}
              role="listbox"
              className="absolute z-20 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
            >
              {rows.map((row) => (
                <li key={row.key}>
                  <button
                    type="button"
                    role="option"
                    aria-selected="false"
                    onClick={() => {
                      onChange(row);
                      setRows([]);
                    }}
                    className="w-full rounded-md px-3 py-2 text-left hover:bg-indigo-50 focus:bg-indigo-50"
                  >
                    <span className="block font-medium">{row.name}</span>
                    {row.secondary ? (
                      <span className="block text-xs text-slate-500">{row.secondary}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </div>
  );
}
