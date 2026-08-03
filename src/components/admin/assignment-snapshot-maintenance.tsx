"use client";
import { useState } from "react";
import { Download, Wrench } from "lucide-react";
import {
  ASSIGNMENT_SNAPSHOT_CONFIRMATION,
  assignmentSnapshotFieldLabel,
  assignmentSnapshotResultCsv,
  type AssignmentSnapshotBackfillResult,
  type AssignmentSnapshotBackfillRow,
} from "@/features/assignment/assignment-tower-snapshot-contract";
const button =
  "inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold disabled:opacity-50";
const download = (rows: AssignmentSnapshotBackfillRow[], name: string) => {
  const blob = new Blob([assignmentSnapshotResultCsv(rows)], { type: "text/csv;charset=utf-8" }),
    url = URL.createObjectURL(blob),
    anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};
export function AssignmentSnapshotMaintenance() {
  const [preview, setPreview] = useState<AssignmentSnapshotBackfillResult | null>(null),
    [result, setResult] = useState<{
      batchId: string;
      repairedCount: number;
      rows: AssignmentSnapshotBackfillRow[];
    } | null>(null),
    [confirmation, setConfirmation] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function load() {
    if (busy) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/admin/assignments/tower-snapshot-backfill/preview", {
          method: "POST",
        }),
        body = await response.json();
      if (!response.ok) throw new Error(body.error || "Preview failed.");
      setPreview(body.data);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Preview failed.");
    } finally {
      setBusy(false);
    }
  }
  async function repair() {
    if (busy || !preview) return;
    setBusy(true);
    setError("");
    try {
      const assignmentKeys = preview.rows
          .filter((row) => row.classification === "repairable")
          .map((row) => row.assignmentKey),
        response = await fetch("/api/admin/assignments/tower-snapshot-backfill/commit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "active_only", confirmation, assignmentKeys }),
        }),
        body = await response.json();
      if (!response.ok) throw new Error(body.error || "Repair failed.");
      setResult(body.data);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Repair failed.");
    } finally {
      setBusy(false);
    }
  }
  const rows = result?.rows ?? preview?.rows ?? [];
  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
          Administrator maintenance
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Assignment Snapshot Maintenance</h1>
        <p className="mt-2 text-sm text-slate-600">
          Preview and add missing Full Tower snapshot fields from exact /image assignment_id
          matches to eligible active Assignments. Historical Assignments are never modified.
        </p>
      </header>
      <section className="rounded-2xl border bg-white p-5">
        <div className="flex flex-wrap gap-3">
          <button className={button} disabled={busy} onClick={() => void load()}>
            Preview
          </button>
          {rows.length ? (
            <button
              className={button}
              onClick={() =>
                download(
                  rows,
                  result ? "assignment-snapshot-results.csv" : "assignment-snapshot-preview.csv",
                )
              }
            >
              <Download className="size-4" />
              Export CSV
            </button>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}
      </section>
      {preview ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {[
              ["Total scanned", preview.scannedCount],
              ["Active repairable", preview.repairableActiveCount],
              ["Historical preserved", preview.historicalCount],
              ["Already complete", preview.alreadyCompleteCount],
              ["Missing Full Tower image", preview.missingTowerCount],
              ["Blocked", preview.blockedCount + preview.ambiguousCount],
            ].map(([label, value]) => (
              <article className="rounded-2xl border bg-white p-4" key={label}>
                <p className="text-xs uppercase text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
              </article>
            ))}
          </section>
          <section className="rounded-2xl border bg-white p-5">
            <h2 className="font-semibold">Missing-field counts</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(preview.fieldCounts).map(([field, count]) => (
                <div key={field}>
                  <dt className="text-xs uppercase text-slate-500">
                    {assignmentSnapshotFieldLabel(field)}
                  </dt>
                  <dd className="font-semibold">{count}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="rounded-2xl border bg-white p-5">
            <h2 className="font-semibold">Repair active Assignments</h2>
            <p className="mt-2 text-sm text-slate-600">
              Up to 50 previewed active Assignments are re-read and revalidated. Existing snapshot
              values are never overwritten.
            </p>
            <label className="mt-4 block max-w-md text-sm font-medium">
              Type {ASSIGNMENT_SNAPSHOT_CONFIRMATION}
              <input
                className="field-control"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </label>
            <button
              className={`${button} mt-3 bg-indigo-700 text-white`}
              disabled={
                busy ||
                confirmation !== ASSIGNMENT_SNAPSHOT_CONFIRMATION ||
                preview.repairableActiveCount === 0
              }
              onClick={() => void repair()}
            >
              <Wrench className="size-4" />
              {busy ? "Repairing…" : "Repair active Assignments"}
            </button>
            {result ? (
              <p role="status" className="mt-3 text-sm font-semibold text-emerald-700">
                {result.repairedCount} Assignment(s) repaired. Batch {result.batchId}.
              </p>
            ) : null}
          </section>
        </>
      ) : null}
      {rows.length ? (
        <section className="overflow-hidden rounded-2xl border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Assignment ID",
                    "Tower ID",
                    "Status",
                    "Missing fields",
                    "Classification",
                    "Result",
                  ].map((label) => (
                    <th className="px-3 py-3" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.assignmentKey}>
                    <td className="px-3 py-3">{row.assignmentId || row.assignmentKey}</td>
                    <td className="px-3 py-3">{row.towerId || "Not available"}</td>
                    <td className="px-3 py-3">{row.status || "Not available"}</td>
                    <td className="px-3 py-3">
                      {row.missingFields.map(assignmentSnapshotFieldLabel).join(", ") || "None"}
                    </td>
                    <td className="px-3 py-3">
                      {row.sourceClassification ?? row.classification}
                    </td>
                    <td className="px-3 py-3">{row.result ?? row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
