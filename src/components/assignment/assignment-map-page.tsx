"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, MapPinned } from "lucide-react";
import { PageHeader } from "@/components/application-shell/page-header";
import {
  type AssignmentMapData,
  type AssignmentMapFilters,
  type AssignmentMapMarker,
  type AssignmentMapPreset,
} from "@/features/assignment/assignment-map-contract";
import { dashboardPresetDates } from "@/features/assignment/assignment-dashboard-contract";

const MapCanvas = dynamic(() => import("./assignment-map-canvas"), {
  ssr: false,
  loading: () => <div role="status" className="h-[55vh] min-h-[24rem] animate-pulse rounded-2xl bg-slate-200"><span className="sr-only">Loading Assignment map</span></div>,
});
const inputClass = "mt-1.5 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export function AssignmentMapPage({ filters, data, styleUrl }: {
  filters: AssignmentMapFilters;
  data: AssignmentMapData;
  styleUrl: string;
}) {
  const router = useRouter(), pathname = usePathname(), params = useSearchParams();
  const [draft, setDraft] = useState(filters);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const selected = useMemo(
    () => data.markers.find((marker) => marker.key === selectedKey) ?? null,
    [data.markers, selectedKey],
  );
  const navigate = () => {
    const next = new URLSearchParams(params.toString());
    for (const key of ["preset", "startDate", "endDate", "coordinator", "rigger", "category", "region", "status", "slaState", "keyword"]) {
      const value = String(draft[key as keyof AssignmentMapFilters] ?? "");
      if (value) next.set(key, value); else next.delete(key);
    }
    startTransition(() => router.push(`${pathname}?${next}`));
  };
  const setPreset = (value: string) => setDraft((current) => {
    const preset = value as AssignmentMapPreset;
    return preset === "custom"
      ? { ...current, preset }
      : { ...current, preset, ...dashboardPresetDates(preset) };
  });

  return <div className={`space-y-4 ${pending ? "opacity-70" : ""}`} aria-busy={pending}>
    <PageHeader title="Assignment Map" description="Geographic view of existing Assignment locations and SLA signals." actions={<div className="flex gap-2"><Link href="/home/assignment" className="inline-flex min-h-10 items-center rounded-xl border bg-white px-3 text-sm font-semibold text-indigo-700 focus-visible:ring-2">List</Link><Link href="/home/assignment/dashboard" className="inline-flex min-h-10 items-center rounded-xl border bg-white px-3 text-sm font-semibold text-indigo-700 focus-visible:ring-2">Dashboard</Link></div>} />
    {filters.error ? <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{filters.error} The default range was applied.</p> : null}
    {data.exceededLimit ? <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">More than 5,000 Assignments matched. Narrow the date range for a complete map.</p> : null}
    <details open className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <summary className="cursor-pointer text-sm font-semibold focus-visible:ring-2">Map filters</summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Select label="Date range" value={draft.preset} change={setPreset} options={[["today","Today"],["week","This Week"],["month","This Month"],["last30","Last 30 Days"],["custom","Custom Range"]]} />
        <Input label="Start date" type="date" value={draft.startDate} change={(value) => setDraft((current) => ({ ...current, startDate: value, preset: "custom" }))} />
        <Input label="End date" type="date" value={draft.endDate} change={(value) => setDraft((current) => ({ ...current, endDate: value, preset: "custom" }))} />
        <Select label="Status" value={draft.status} change={(value) => setDraft((current) => ({ ...current, status: value }))} options={[["","All statuses"], ...["Open","Accepted","On Progress","Paused","Finished","Rejected","Dropped"].map(pair)]} />
        <Select label="SLA" value={draft.slaState} change={(value) => setDraft((current) => ({ ...current, slaState: value as AssignmentMapFilters["slaState"] }))} options={[["","All SLA states"], ...["On Track","Warning","Overdue","Escalated","Unavailable","Not Applicable"].map(pair)]} />
        <Select label="Coordinator" value={draft.coordinator} change={(value) => setDraft((current) => ({ ...current, coordinator: value }))} options={selectOptions("All coordinators", data.options.coordinators)} />
        <Select label="Rigger" value={draft.rigger} change={(value) => setDraft((current) => ({ ...current, rigger: value }))} options={selectOptions("All riggers", data.options.riggers)} />
        <Select label="Category" value={draft.category} change={(value) => setDraft((current) => ({ ...current, category: value }))} options={selectOptions("All categories", data.options.categories)} />
        <Select label="Region" value={draft.region} change={(value) => setDraft((current) => ({ ...current, region: value }))} options={selectOptions("All regions", data.options.regions)} />
        <Input label="Search" value={draft.keyword} change={(value) => setDraft((current) => ({ ...current, keyword: value }))} placeholder="Assignment, tower, site, cluster, location" />
      </div>
      <div className="mt-4 flex gap-2"><button type="button" onClick={navigate} disabled={pending} className="min-h-10 rounded-xl bg-indigo-700 px-4 text-sm font-semibold text-white focus-visible:ring-2">Apply</button><button type="button" onClick={() => startTransition(() => router.push(pathname))} className="min-h-10 rounded-xl border px-4 text-sm font-semibold focus-visible:ring-2">Reset</button></div>
    </details>
    <section aria-label="Coordinate summary" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[["Mapped",data.coordinateCounts.valid],["Missing",data.coordinateCounts.missing],["Invalid",data.coordinateCounts.invalid],["Possibly reversed",data.coordinateCounts["possibly-reversed"]]].map(([label,value]) => <article key={label} className="rounded-xl border bg-white p-3"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></article>)}
    </section>
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
      <section aria-label="Assignment geographic map" className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {!styleUrl ? <MapConfiguration /> : data.markers.length ? <MapCanvas markers={data.markers} selectedKey={selectedKey} select={setSelectedKey} styleUrl={styleUrl} /> : <EmptyMap />}
      </section>
      <aside className="space-y-4">
        {selected ? <Preview marker={selected} /> : <section className="rounded-2xl border bg-white p-4 shadow-sm"><h2 className="font-semibold">Assignment preview</h2><p className="mt-2 text-sm text-slate-500">Select a marker or an item from the accessible results.</p></section>}
        <AccessibleResults markers={data.markers} select={setSelectedKey} selectedKey={selectedKey} />
        <MissingCoordinates data={data} />
      </aside>
    </div>
  </div>;
}

const pair = (value: string): [string,string] => [value,value];
const selectOptions = (all: string, values: string[]): [string,string][] => [["",all], ...values.map(pair)];
function Input({ label, value, change, type = "text", placeholder }: { label:string; value:string; change:(value:string)=>void; type?:string; placeholder?:string }) { return <label className="text-sm font-medium">{label}<input className={inputClass} type={type} value={value} maxLength={200} placeholder={placeholder} onChange={(event) => change(event.target.value)} /></label>; }
function Select({ label, value, change, options }: { label:string; value:string; change:(value:string)=>void; options:[string,string][] }) { return <label className="text-sm font-medium">{label}<select className={inputClass} value={value} onChange={(event) => change(event.target.value)}>{options.map(([key,text]) => <option key={key} value={key}>{text}</option>)}</select></label>; }
function EmptyMap() { return <div className="flex min-h-[24rem] flex-col items-center justify-center text-center text-slate-500"><MapPinned className="size-10" /><p className="mt-3 font-semibold">No mapped Assignments</p><p className="text-sm">Adjust the filters or review unavailable coordinates.</p></div>; }
function MapConfiguration() { return <div role="status" className="flex min-h-[24rem] flex-col items-center justify-center px-6 text-center text-slate-600"><MapPinned className="size-10" /><p className="mt-3 font-semibold">Map tiles are not configured</p><p className="mt-1 max-w-xl text-sm">Set NEXT_PUBLIC_ASSIGNMENT_MAP_STYLE_URL to an approved MapLibre style provider. Assignment coordinate summaries and accessible results remain available without external map requests.</p></div>; }
function Preview({ marker }: { marker: AssignmentMapMarker }) { return <section aria-live="polite" className="rounded-2xl border bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-2"><div><p className="text-xs text-slate-500">{marker.towerId || "No tower ID"}</p><h2 className="font-semibold">{marker.assignmentId}</h2></div><SlaState state={marker.slaState} /></div><dl className="mt-3 grid grid-cols-2 gap-2 text-sm"><Field label="Status" value={marker.status} /><Field label="Site" value={marker.siteName} /><Field label="Cluster" value={marker.clusterName} /><Field label="Region" value={marker.region} /><Field label="Rigger" value={marker.riggerName} /><Field label="Category" value={marker.category} /></dl><Link href={`/home/assignment/${encodeURIComponent(marker.key)}`} className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-indigo-700 px-4 text-sm font-semibold text-white focus-visible:ring-2">View Assignment detail</Link></section>; }
function SlaState({ state }: { state:string }) { return <span aria-label={`SLA status: ${state}`} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-800">{state}</span>; }
function Field({ label, value }: { label:string; value:string }) { return <div><dt className="text-xs text-slate-500">{label}</dt><dd className="font-medium">{value || "Unavailable"}</dd></div>; }
function AccessibleResults({ markers, select, selectedKey }: { markers:AssignmentMapMarker[]; select:(key:string)=>void; selectedKey:string|null }) { return <details open className="rounded-2xl border bg-white shadow-sm"><summary className="cursor-pointer p-4 text-sm font-semibold focus-visible:ring-2">Mapped Assignments ({markers.length})</summary><ul className="max-h-80 divide-y overflow-y-auto">{markers.map((marker) => <li key={marker.key}><button type="button" aria-pressed={selectedKey === marker.key} onClick={() => select(marker.key)} className="w-full p-3 text-left hover:bg-indigo-50 focus-visible:ring-2"><span className="block text-sm font-semibold text-indigo-700">{marker.assignmentId}</span><span className="block text-xs text-slate-500">{marker.towerId} · {marker.siteName || marker.region || "Location unavailable"} · {marker.slaState}</span></button></li>)}</ul></details>; }
function MissingCoordinates({ data }: { data:AssignmentMapData }) { return <details className="rounded-2xl border bg-white shadow-sm"><summary className="flex cursor-pointer items-center gap-2 p-4 text-sm font-semibold focus-visible:ring-2"><AlertTriangle className="size-4 text-amber-600" />Unavailable coordinates ({data.missing.length})</summary>{data.missing.length ? <ul className="max-h-64 divide-y overflow-y-auto">{data.missing.map((item) => <li key={item.key} className="p-3 text-sm"><Link href={`/home/assignment/${encodeURIComponent(item.key)}`} className="font-semibold text-indigo-700">{item.assignmentId}</Link><p className="text-xs text-slate-500">{item.towerId || "No tower ID"} · {item.reason}</p></li>)}</ul> : <p className="px-4 pb-4 text-sm text-slate-500">All filtered Assignments have valid coordinates.</p>}</details>; }
