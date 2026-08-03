"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Download, Eye, RefreshCw, Search, X } from "lucide-react";
import { PageHeader } from "@/components/application-shell/page-header";
import type { AssignmentListItem } from "@/features/assignment/assignment-types";
import type {
  AssignmentFilterCategory,
  AssignmentListQueryInput,
  AssignmentSearchType,
} from "@/features/assignment/assignment-query-contract";
import { AssignmentStatusBadge } from "./assignment-status-badge";
import { AssignmentSlaBadge, formatSlaDuration } from "./assignment-sla-badge";
import { AssignmentCreateDialog } from "./assignment-create-dialog";
import { AssignmentReassignRiggerDialog } from "./assignment-reassign-rigger-dialog";
import { AssignmentImportDialog } from "./assignment-import-dialog";

interface Props {
  rows: AssignmentListItem[];
  query: AssignmentListQueryInput;
}

const filters: readonly [AssignmentFilterCategory, string][] = [
  ["status", "Status"],
  ["region", "Region"],
  ["sub_region", "Sub-region"],
  ["company", "Partner"],
  ["rigger_name", "Rigger"],
];
const inputClass =
  "mt-1.5 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
const safe = (value: string | null) => value || "—";

function displayDate(value: string | null) {
  if (!value) return "—";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function AssignmentPageClient({ rows, query }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchType, setSearchType] = useState<AssignmentSearchType>(
    query.searchType ?? "assignmentId",
  );
  const [searchValue, setSearchValue] = useState(query.searchValue ?? "");
  const [timeBasis, setTimeBasis] = useState(query.timeBasis);
  const [startDate, setStartDate] = useState(query.startDate);
  const [endDate, setEndDate] = useState(query.endDate);
  const [filterCategory, setFilterCategory] = useState<AssignmentFilterCategory | "">(
    query.filterCategory ?? "",
  );
  const [filterValue, setFilterValue] = useState(query.filterValues?.[0] ?? "");
  const [slaState, setSlaState] = useState(query.slaState ?? "");
  const [agingBucket, setAgingBucket] = useState(query.agingBucket ?? "");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const initialSearch = useRef(true);

  function navigate(changes: Record<string, string | null>, resetPage = true) {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    if (resetPage) next.set("page", "1");
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  useEffect(() => {
    if (initialSearch.current) {
      initialSearch.current = false;
      return;
    }
    const trimmed = searchValue.trim();
    if (!trimmed || (query.searchType === searchType && query.searchValue === trimmed)) return;
    const timeout = window.setTimeout(
      () =>
        navigate({
          searchType,
          searchValue: trimmed,
        }),
      500,
    );
    return () => window.clearTimeout(timeout);
    // navigate intentionally reads the latest URL when the debounce settles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchType, searchValue, query.searchType, query.searchValue]);

  const validDates =
    /^\d{4}-\d{2}-\d{2}$/.test(startDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(endDate) &&
    startDate <= endDate;
  const validFilter = !filterCategory || Boolean(filterValue.trim());
  const canApply = validDates && validFilter;

  function applyFilters() {
    if (!canApply) return;
    const legacyClears = Object.fromEntries(filters.map(([key]) => [key, null]));
    navigate({
      ...legacyClears,
      timeBasis,
      startDate,
      endDate,
      filterCategory: filterCategory || null,
      filterValues: filterCategory ? filterValue.trim() : null,
      slaState: slaState || null,
      agingBucket: agingBucket || null,
    });
  }

  function clearFilter() {
    setFilterCategory("");
    setFilterValue("");
    navigate({ filterCategory: null, filterValues: null });
  }

  function clearSearch() {
    setSearchValue("");
    navigate({ searchType: null, searchValue: null });
  }

  function resetAll() {
    setSearchType("assignmentId");
    setSearchValue("");
    setFilterCategory("");
    setFilterValue("");
    startTransition(() => router.push(pathname));
  }

  async function exportCsv() {
    if (exporting) return;
    setExporting(true);
    setExportError("");
    try {
      const response = await fetch(`/api/assignments/export?${searchParams.toString()}`, {
        credentials: "same-origin",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Export could not be generated.");
      }
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? "radaba-assignments.csv";
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export could not be generated.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div
      className={`space-y-4 transition-opacity duration-200 ${isPending ? "opacity-70" : ""}`}
      aria-busy={isPending}
    >
      <PageHeader
        title="Assignment"
        description="Manage, search, and export assignment records"
        actions={
          <Toolbar
            pending={isPending}
            exporting={exporting}
            refresh={() => startTransition(() => router.refresh())}
            exportCsv={exportCsv}
          />
        }
      />
      {exportError ? (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {exportError}
        </p>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {exporting ? "CSV export in progress" : exportError || ""}
      </p>

      <section
        aria-labelledby="assignment-search"
        className="rounded-t-2xl border border-slate-200 bg-gradient-to-r from-white to-indigo-50/40 p-4 shadow-sm sm:p-5"
      >
        <h2 id="assignment-search" className="text-sm font-semibold text-slate-950">
          Search
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-[11rem_minmax(16rem,1fr)_auto] md:items-end">
          <label className="text-sm font-medium text-slate-700">
            Search type
            <select
              value={searchType}
              onChange={(event) => setSearchType(event.target.value as AssignmentSearchType)}
              className={inputClass}
            >
              <option value="assignmentId">Assignment ID</option>
              <option value="towerId">Tower ID</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Search value
            <span className="relative block">
              <Search aria-hidden="true" className="absolute left-3 top-4 size-4 text-slate-400" />
              <input
                value={searchValue}
                maxLength={200}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={`Enter ${searchType === "assignmentId" ? "Assignment ID" : "Tower ID"}`}
                className={`${inputClass} pl-9`}
              />
            </span>
          </label>
          <button
            type="button"
            disabled={!query.searchValue}
            onClick={clearSearch}
            aria-label="Clear Assignment search"
            className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X aria-hidden="true" className="mr-1 inline size-4" />
            Clear
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Results update 500 ms after you stop typing.</p>
      </section>

      <section
        aria-labelledby="assignment-filters"
        className="-mt-4 rounded-b-2xl border border-t-0 border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <h2 id="assignment-filters" className="text-sm font-semibold text-slate-950">
          More filters{" "}
          <span className="ml-2 text-xs font-normal text-slate-500">
            Refine the current result set
          </span>
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-medium text-slate-700">
            Time basis
            <select
              value={timeBasis}
              onChange={(event) => setTimeBasis(event.target.value as typeof timeBasis)}
              className={inputClass}
            >
              <option value="onCreate">Assignment Time</option>
              <option value="onFinish">Finished Time</option>
            </select>
          </label>
          <DateDraft label="Start date" value={startDate} setValue={setStartDate} />
          <DateDraft label="End date" value={endDate} setValue={setEndDate} />
          <label className="text-sm font-medium text-slate-700">
            Filter category
            <select
              value={filterCategory}
              onChange={(event) => {
                setFilterCategory(event.target.value as AssignmentFilterCategory | "");
                setFilterValue("");
              }}
              className={inputClass}
            >
              <option value="">None</option>
              {filters.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            SLA status
            <select
              value={slaState}
              onChange={(event) => setSlaState(event.target.value as typeof slaState)}
              className={inputClass}
            >
              <option value="">All SLA states</option>
              <option value="Warning">Warning only</option>
              <option value="Overdue">Overdue only</option>
              <option value="Escalated">Escalated only</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Aging bucket
            <select
              value={agingBucket}
              onChange={(event) => setAgingBucket(event.target.value as typeof agingBucket)}
              className={inputClass}
            >
              <option value="">All ages</option>
              <option value="0-1">0â€“1 day</option>
              <option value="2-3">2â€“3 days</option>
              <option value="4-7">4â€“7 days</option>
              <option value="8-14">8â€“14 days</option>
              <option value="15+">15+ days</option>
            </select>
          </label>
          {filterCategory ? (
            <FilterValue category={filterCategory} value={filterValue} setValue={setFilterValue} />
          ) : null}
        </div>
        {!validDates ? (
          <p role="alert" className="mt-3 text-sm text-red-700">
            Start date must be on or before end date.
          </p>
        ) : null}
        {!validFilter ? (
          <p role="alert" className="mt-3 text-sm text-red-700">
            Select a non-empty filter value.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!canApply}
            onClick={applyFilters}
            className="min-h-10 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Apply
          </button>
          <button
            type="button"
            disabled={!query.filterCategory}
            onClick={clearFilter}
            className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Clear current filter
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Reset all
          </button>
        </div>
      </section>

      <AppliedSummary
        query={query}
        clearSearch={clearSearch}
        clearFilter={clearFilter}
        clearAll={resetAll}
      />
      {rows.length ? (
        <AssignmentResults rows={rows} page={query.page} pageSize={query.pageSize} />
      ) : (
        <EmptyResults query={query} clearAll={resetAll} />
      )}
      <Pagination rows={rows} query={query} pending={isPending} navigate={navigate} />
    </div>
  );
}

function Toolbar({
  pending,
  exporting,
  refresh,
  exportCsv,
}: {
  pending: boolean;
  exporting: boolean;
  refresh: () => void;
  exportCsv: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link
        href="/home/assignment/dashboard"
        className="inline-flex min-h-10 items-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        Dashboard
      </Link>
      <button
        type="button"
        onClick={refresh}
        disabled={pending}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <RefreshCw
          aria-hidden="true"
          className={`size-4 ${pending ? "animate-spin motion-reduce:animate-none" : ""}`}
        />
        <span className="hidden xl:inline">Refresh</span>
      </button>
      <AssignmentImportDialog />
      <button
        type="button"
        disabled={exporting}
        onClick={exportCsv}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <Download aria-hidden="true" className="size-4" />
        {exporting ? "Exportingâ€¦" : "Export CSV"}
      </button>
      <AssignmentCreateDialog />
    </div>
  );
}

function DateDraft({
  label,
  value,
  setValue,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input
        type="date"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function FilterValue({
  category,
  value,
  setValue,
}: {
  category: AssignmentFilterCategory;
  value: string;
  setValue: (value: string) => void;
}) {
  const label = filters.find(([key]) => key === category)?.[1] ?? "Filter";
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      {category === "status" ? (
        <select
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={inputClass}
        >
          <option value="">Select status</option>
          {["Open", "Accepted", "On Progress", "Paused", "Finished", "Rejected", "Dropped"].map(
            (status) => (
              <option key={status}>{status}</option>
            ),
          )}
        </select>
      ) : (
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={inputClass}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      )}
    </label>
  );
}

function AppliedSummary({
  query,
  clearSearch,
  clearFilter,
  clearAll,
}: {
  query: AssignmentListQueryInput;
  clearSearch: () => void;
  clearFilter: () => void;
  clearAll: () => void;
}) {
  const basis = query.timeBasis === "onCreate" ? "Assignment time" : "Finished time";
  const filterLabel = filters.find(([key]) => key === query.filterCategory)?.[1];
  return (
    <section
      aria-labelledby="applied-summary"
      className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="applied-summary" className="shrink-0 text-sm font-semibold text-indigo-950">
          Applied criteria
        </h2>
        <ul className="flex min-w-0 flex-1 flex-wrap gap-2 text-xs text-indigo-900">
          <li className="rounded-full border border-indigo-100 bg-white px-3 py-1.5 shadow-sm">
            {basis}: {displayDate(query.startDate)} â€“ {displayDate(query.endDate)}
          </li>
          {filterLabel ? (
            <li className="inline-flex items-center rounded-full border border-indigo-100 bg-white pl-3 pr-1.5 shadow-sm">
              {filterLabel}: {query.filterValues?.join(", ")}
              <button
                type="button"
                onClick={clearFilter}
                aria-label={`Remove ${filterLabel} filter`}
                className="ml-1 rounded-full p-1 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          ) : null}
          {query.searchType && query.searchValue ? (
            <li className="inline-flex items-center rounded-full border border-indigo-100 bg-white pl-3 pr-1.5 shadow-sm">
              {query.searchType === "assignmentId" ? "Assignment ID" : "Tower ID"}:{" "}
              {query.searchValue}
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Remove search criterion"
                className="ml-1 rounded-full p-1 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          ) : null}
        </ul>
        <button
          type="button"
          onClick={clearAll}
          className="min-h-9 rounded-lg px-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Clear all
        </button>
      </div>
    </section>
  );
}

function AssignmentResults({
  rows,
  page,
  pageSize,
}: {
  rows: AssignmentListItem[];
  page: number;
  pageSize: number;
}) {
  return (
    <section aria-label="Assignment results">
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="max-h-[65vh] overflow-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                {[
                  "#",
                  "Assignment ID",
                  "Region",
                  "Sub-region",
                  "Partner",
                  "Rigger",
                  "Status",
                  "SLA Status",
                  "Aging",
                  "Assignment Time",
                  "Finished Time",
                  "Image Total",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    scope="col"
                    aria-sort={header === "Assignment Time" ? "descending" : undefined}
                    className="border-b border-slate-200 px-4 py-3 font-semibold"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <AssignmentRow key={row.key} row={row} number={(page - 1) * pageSize + index + 1} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid gap-4 md:hidden">
        {rows.map((row) => (
          <AssignmentCard key={row.key} row={row} />
        ))}
      </div>
    </section>
  );
}

function AssignmentRow({ row, number }: { row: AssignmentListItem; number: number }) {
  return (
    <tr className="transition-colors duration-150 hover:bg-indigo-50/50">
      <td className="px-4 py-3 text-slate-500">{number}</td>
      <td className="max-w-64 break-words px-4 py-3 font-semibold">{safe(row.assignment_id)}</td>
      <td className="px-4 py-3">{safe(row.region)}</td>
      <td className="px-4 py-3">{safe(row.sub_region)}</td>
      <td className="px-4 py-3">{safe(row.company)}</td>
      <td className="px-4 py-3">{safe(row.rigger_name)}</td>
      <td className="px-4 py-3">
        <AssignmentStatusBadge status={row.assignment_state} />
      </td>
      <td className="px-4 py-3">
        <AssignmentSlaBadge sla={row.sla} />
      </td>
      <td className="px-4 py-3">{formatSlaDuration(row.sla?.assignmentAgeMs)}</td>
      <td className="px-4 py-3">{displayDate(row.created_date)}</td>
      <td className="px-4 py-3">{displayDate(row.closed_date)}</td>
      <td className="px-4 py-3">{row.image_total ?? "—"}</td>
      <td className="px-4 py-3">
        <div className="flex flex-col items-start gap-1">
          <ViewLink row={row} />
          <AssignmentReassignRiggerDialog
            row={row}
            assignmentKey={row.key}
            assignmentId={row.assignment_id!}
          />
        </div>
      </td>
    </tr>
  );
}

function AssignmentCard({ row }: { row: AssignmentListItem }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="break-all text-sm font-semibold">{safe(row.assignment_id)}</h3>
        <AssignmentStatusBadge status={row.assignment_state} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <CardField label="Region" value={safe(row.region)} />
        <CardField label="Sub-region" value={safe(row.sub_region)} />
        <CardField label="Partner" value={safe(row.company)} />
        <CardField label="Rigger" value={safe(row.rigger_name)} />
        <CardField label="Aging" value={formatSlaDuration(row.sla?.assignmentAgeMs)} />
        <CardField label="Assignment Time" value={displayDate(row.created_date)} />
        <CardField label="Finished Time" value={displayDate(row.closed_date)} />
        <CardField label="Image Total" value={String(row.image_total ?? "—")} />
      </dl>
      <div className="mt-4 flex flex-wrap gap-4">
        <ViewLink row={row} />
        <AssignmentReassignRiggerDialog
          row={row}
          assignmentKey={row.key}
          assignmentId={row.assignment_id!}
        />
      </div>
    </article>
  );
}

function CardField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words">{value}</dd>
    </div>
  );
}

function ViewLink({ row }: { row: AssignmentListItem }) {
  return (
    <Link
      href={`/home/assignment/${encodeURIComponent(row.key)}`}
      aria-label={`View assignment ${row.assignment_id || row.key}`}
      className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <Eye aria-hidden="true" className="size-4" />
      View
    </Link>
  );
}

function EmptyResults({
  query,
  clearAll,
}: {
  query: AssignmentListQueryInput;
  clearAll: () => void;
}) {
  const filtered = Boolean(query.searchValue || query.filterCategory);
  return (
    <section
      aria-labelledby="no-results"
      className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm"
    >
      <div
        className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-700"
        aria-hidden="true"
      >
        âŒ•
      </div>
      <h2 id="no-results" className="mt-4 text-base font-semibold text-slate-950">
        No assignments found
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        {filtered
          ? "No records match the current search or date range. Clear the filters and try again."
          : "No assignments exist in the selected date range."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={clearAll}
          className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Clear filters
        </button>
        <AssignmentCreateDialog />
      </div>
    </section>
  );
}

function Pagination({
  rows,
  query,
  pending,
  navigate,
}: {
  rows: AssignmentListItem[];
  query: AssignmentListQueryInput;
  pending: boolean;
  navigate: (changes: Record<string, string | null>, reset?: boolean) => void;
}) {
  const first = rows.length ? (query.page - 1) * query.pageSize + 1 : 0;
  const last = rows.length ? first + rows.length - 1 : 0;
  return (
    <nav
      aria-label="Assignment pagination"
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-slate-600">
        Showing{" "}
        <span className="font-semibold text-slate-800">
          {first}–{last}
        </span>{" "}
        on page {query.page}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-slate-600">
          Rows per page
          <select
            value={query.pageSize}
            onChange={(event) => navigate({ pageSize: event.target.value })}
            className="ml-2 min-h-10 rounded-lg border border-slate-300 bg-white px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <option>10</option>
            <option>25</option>
            <option>50</option>
          </select>
        </label>
        <button
          type="button"
          disabled={query.page === 1 || pending}
          onClick={() => navigate({ page: String(query.page - 1) }, false)}
          className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Previous
        </button>
        <span
          className="min-w-16 text-center text-sm font-semibold text-slate-700"
          aria-current="page"
        >
          Page {query.page}
        </span>
        <button
          type="button"
          disabled={rows.length < query.pageSize || pending}
          onClick={() => navigate({ page: String(query.page + 1) }, false)}
          className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
