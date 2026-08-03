"use client";
import { useCallback, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ASSIGNMENT_IMPORT_MAX_BYTES,
  ASSIGNMENT_IMPORT_MAX_ROWS,
  assignmentImportErrorReport,
  parseAssignmentCsv,
  type AssignmentImportRow,
  type AssignmentImportRowResult,
  type AssignmentImportValidation,
} from "@/features/assignment/assignment-import-contract";
import { AssignmentDialogShell } from "./assignment-dialog-shell";

type Stage = "select" | "preview" | "validated" | "importing" | "results";
interface ServerResult extends AssignmentImportValidation {
  filename: string;
  importedRows?: number;
}
export function AssignmentImportDialog() {
  const router = useRouter(),
    [open, setOpen] = useState(false),
    [stage, setStage] = useState<Stage>("select"),
    [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState<AssignmentImportRow[]>([]),
    [result, setResult] = useState<ServerResult | null>(null),
    [error, setError] = useState("");
  const busy = stage === "importing",
    close = useCallback(() => {
      if (!busy) setOpen(false);
    }, [busy]);
  function reset() {
    setFile(null);
    setPreview([]);
    setResult(null);
    setError("");
    setStage("select");
  }
  async function select(selected: File | null) {
    reset();
    if (!selected) return;
    setFile(selected);
    try {
      if (!selected.name.toLowerCase().endsWith(".csv")) throw new Error("Select a .csv file.");
      if (selected.size > ASSIGNMENT_IMPORT_MAX_BYTES)
        throw new Error("File exceeds the 1 MiB limit.");
      const rows = parseAssignmentCsv(await selected.text());
      setPreview(rows);
      setStage("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "File could not be parsed.");
    }
  }
  async function send(endpoint: string) {
    if (!file || busy) return;
    setError("");
    setStage("importing");
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch(endpoint, {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      const body = await response.json();
      if (!response.ok) {
        if (response.status === 422 && body.data) {
          setResult(body.data);
          setStage("validated");
          setError(
            "The file is no longer valid. No Assignments were created; review the updated results.",
          );
          return;
        }
        if (response.status === 401)
          throw new Error("Your session expired. Sign in and try again.");
        if (response.status === 403)
          throw new Error("You do not have permission to import Assignments.");
        if (response.status === 409)
          throw new Error(
            "Assignment data changed after validation. No Assignments were created; validate again.",
          );
        if (response.status === 413)
          throw new Error("The file or row count exceeds the supported limit.");
        if (response.status === 422)
          throw new Error(
            "The file is no longer valid. No Assignments were created; review the updated results.",
          );
        throw new Error(body.error || "Import request failed.");
      }
      setResult(body.data);
      if (endpoint.endsWith("/commit")) {
        setStage("results");
        router.refresh();
      } else setStage("validated");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import request failed.");
      setStage(result ? "validated" : "preview");
    }
  }
  function downloadErrors() {
    if (!result) return;
    const blob = new Blob(
        [assignmentImportErrorReport(result.rows.filter((r) => r.status === "invalid"))],
        { type: "text/csv;charset=utf-8" },
      ),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `radaba-assignment-import-errors-${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(true);
          }}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-indigo-300 bg-white px-3 text-sm font-semibold text-indigo-800 focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <Upload className="size-4" />
          Import
        </button>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- API file download */}
        <a
          href="/api/assignments/import/template"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <Download className="size-4" />
          Template
        </a>
      </div>
      {open ? (
        <AssignmentDialogShell
          title="Import Assignments"
          description="Validate every row before explicitly confirming one all-or-nothing batch."
          close={close}
        >
          <div className="mt-5 space-y-5">
            <ol className="flex flex-wrap gap-2 text-xs" aria-label="Import stages">
              {["Select", "Preview", "Validate", "Confirm", "Import", "Results"].map(
                (name, index) => (
                  <li
                    key={name}
                    className={`rounded-full px-3 py-1 ${index <= ["select", "preview", "validated", "validated", "importing", "results"].indexOf(stage) ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-500"}`}
                  >
                    {index + 1}. {name}
                  </li>
                ),
              )}
            </ol>
            {stage === "select" ? (
              <section>
                <label className="block text-sm font-semibold" htmlFor="assignment-import-file">
                  CSV file
                </label>
                <input
                  id="assignment-import-file"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => select(e.target.files?.[0] ?? null)}
                  className="mt-2 block w-full rounded-lg border border-slate-300 p-3"
                />
                <p className="mt-2 text-sm text-slate-600">
                  CSV only Â· UTF-8 Â· maximum 1 MiB Â· maximum {ASSIGNMENT_IMPORT_MAX_ROWS} rows. The
                  downloaded template includes five sample rows for reference; delete them before
                  adding and importing your data. Selecting a file never writes data.
                </p>
              </section>
            ) : null}
            {file ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm">
                <span>
                  <strong>{file.name}</strong> Â· {preview.length} rows
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={reset}
                  className="font-semibold text-indigo-700"
                >
                  Replace file
                </button>
              </div>
            ) : null}
            {(stage === "preview" || stage === "importing") && !result ? (
              <Preview
                rows={preview.map((row) => ({
                  rowNumber: row.rowNumber,
                  towerId: row.tower_id,
                  status: "valid",
                  errors: [],
                }))}
              />
            ) : null}
            {result ? (
              <>
                <Summary result={result} />
                <Preview rows={result.rows} />
                {result.invalidRows ? (
                  <button
                    type="button"
                    onClick={downloadErrors}
                    className="min-h-10 rounded-lg border border-slate-300 px-3 font-semibold"
                  >
                    <Download className="mr-2 inline size-4" />
                    Download error report
                  </button>
                ) : null}
              </>
            ) : null}
            {error ? (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <p aria-live="polite" className="sr-only">
              {busy
                ? "Import request in progress"
                : error || result
                  ? `${result?.validRows ?? 0} valid and ${result?.invalidRows ?? 0} invalid rows`
                  : ""}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={busy}
                className="min-h-11 rounded-lg border border-slate-300 px-4 font-semibold"
              >
                {stage === "results" ? "Close" : "Cancel"}
              </button>
              {stage === "preview" ? (
                <button
                  type="button"
                  onClick={() => send("/api/assignments/import/validate")}
                  className="min-h-11 rounded-lg bg-indigo-700 px-4 font-semibold text-white"
                >
                  Validate file
                </button>
              ) : null}
              {stage === "validated" && result?.canCommit ? (
                <button
                  type="button"
                  onClick={() => send("/api/assignments/import/commit")}
                  className="min-h-11 rounded-lg bg-indigo-700 px-4 font-semibold text-white"
                >
                  Confirm import of {result.validRows} rows
                </button>
              ) : null}
              {busy ? (
                <button
                  disabled
                  className="min-h-11 rounded-lg bg-indigo-700 px-4 font-semibold text-white opacity-60"
                >
                  Processingâ€¦
                </button>
              ) : null}
            </div>
          </div>
        </AssignmentDialogShell>
      ) : null}
    </>
  );
}
function Summary({ result }: { result: ServerResult }) {
  return (
    <div
      role="status"
      className="grid grid-cols-2 gap-2 rounded-xl bg-indigo-50 p-4 text-sm sm:grid-cols-5"
    >
      {[
        ["Total", result.totalRows],
        ["Valid", result.validRows],
        ["Invalid", result.invalidRows],
        ["Warnings", result.warningRows],
        ["Imported", result.importedRows ?? 0],
      ].map(([label, value]) => (
        <div key={label}>
          <span className="block text-xs text-slate-500">{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}
function Preview({ rows }: { rows: AssignmentImportRowResult[] }) {
  return (
    <section aria-label="Import row results">
      <div className="hidden max-h-72 overflow-auto rounded-lg border border-slate-200 sm:block">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              <th className="p-2">Row</th>
              <th>Tower</th>
              <th>Status</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 200).map((row) => (
              <tr key={row.rowNumber} className="border-t">
                <td className="p-2">{row.rowNumber}</td>
                <td>{row.towerId}</td>
                <td>{row.status}</td>
                <td>{row.message ?? "Ready"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-2 sm:hidden">
        {rows.slice(0, 200).map((row) => (
          <article
            id={`import-row-${row.rowNumber}`}
            key={row.rowNumber}
            className="rounded-lg border p-3 text-sm"
          >
            <strong>
              Row {row.rowNumber}: {row.towerId}
            </strong>
            <p>
              {row.status} Â· {row.message ?? "Ready"}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
