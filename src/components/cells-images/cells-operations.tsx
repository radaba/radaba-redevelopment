"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Columns3, Download, Eye, RefreshCw, RotateCcw, Search } from "lucide-react";
import { PageHeader } from "@/components/application-shell/page-header";
import { extractEmbeddedImages } from "@/features/cells-images/embedded-image-contract";
import type { CellRecord } from "@/features/cells-images/cells-images-types";
import type { CellsImagesListResult } from "@/server/cells-images/cells-images-repository";

const text = (value: unknown) => String(value ?? "").trim();
const display = (value: unknown) => text(value) || "—";
const date = (value: unknown) => {
  const raw = text(value);
  if (!raw) return "—";
  const parsed = new Date(raw);
  return Number.isNaN(parsed.valueOf()) ? raw : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(parsed);
};
const imageCount = (cell: CellRecord) => extractEmbeddedImages({ sourceRecordType: "cell", sourceRecordKey: cell.databaseKey, record: cell }).length;
const completed = (cell: CellRecord) => Boolean(text(cell.closed_datetime ?? cell.closed_date));
const csvCell = (value: unknown) => {
  let raw = text(value);
  if (/^[=+\-@]/.test(raw)) raw = `'${raw}`;
  return `"${raw.replaceAll('"', '""')}"`;
};
const fields = [
  ["q", "Search", "RCell ID, key, assignment, tower or site"], ["assignment", "Assignment", ""], ["tower", "Tower", ""],
  ["site", "Site", ""], ["sector", "Sector", ""], ["band", "Band", ""], ["region", "Region", ""],
  ["company", "Company", ""], ["rigger", "Rigger", ""], ["coordinator", "Coordinator", ""],
] as const;
const columns = ["key", "rcell", "sector", "band", "tower", "site", "assignment", "rru", "antenna", "images", "closed", "rigger"] as const;
type Column = typeof columns[number];
type Filters = Record<typeof fields[number][0], string> & { status: string; hasImages: string; submitted: string; closed: string };

export function CellsOperations({ result, cursor }: { result: CellsImagesListResult<CellRecord>; cursor?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filters, setFilters] = useState<Filters>({ q:"",assignment:"",tower:"",site:"",sector:"",band:"",region:"",company:"",rigger:"",coordinator:"",status:"",hasImages:"",submitted:"",closed:"" });
  const [visible, setVisible] = useState<Set<Column>>(new Set(columns));
  const [settings, setSettings] = useState(false);
  const [sort, setSort] = useState<{ key: Column; direction: 1 | -1 }>({ key: "closed", direction: -1 });
  const rows = useMemo(() => result.rows.filter((cell) => {
    const count = imageCount(cell);
    const haystack = [cell.databaseKey,cell.rcell_id,cell.assignment_id,cell.tower_id,cell.sitename].map(text).join(" ").toLowerCase();
    if (filters.q && !haystack.includes(filters.q.toLowerCase())) return false;
    const exact: [keyof Filters, unknown][] = [["assignment",cell.assignment_id],["tower",cell.tower_id],["site",cell.sitename],["sector",cell.sector],["band",cell.band],["region",cell.region],["company",cell.company],["rigger",cell.rigger_name],["coordinator",cell.coordinator_name]];
    if (exact.some(([key,value]) => filters[key] && !text(value).toLowerCase().includes(filters[key].toLowerCase()))) return false;
    if (filters.status === "completed" && !completed(cell)) return false;
    if (filters.status === "pending" && completed(cell)) return false;
    if (filters.hasImages === "yes" && count === 0) return false;
    if (filters.hasImages === "no" && count > 0) return false;
    if (filters.submitted && !text(cell.submitted_at ?? cell.created_datetime).startsWith(filters.submitted)) return false;
    if (filters.closed && !text(cell.closed_datetime ?? cell.closed_date).startsWith(filters.closed)) return false;
    return true;
  }).sort((a,b) => {
    const value = (cell: CellRecord) => ({key:cell.databaseKey,rcell:cell.rcell_id,sector:cell.sector,band:cell.band,tower:cell.tower_id,site:cell.sitename,assignment:cell.assignment_id,rru:cell.rru_type,antenna:cell.antenna_type,images:imageCount(cell),closed:cell.closed_datetime??cell.closed_date,rigger:cell.rigger_name})[sort.key];
    return String(value(a) ?? "").localeCompare(String(value(b) ?? ""), undefined, { numeric: true }) * sort.direction;
  }), [filters, result.rows, sort]);
  const reset = () => setFilters({ q:"",assignment:"",tower:"",site:"",sector:"",band:"",region:"",company:"",rigger:"",coordinator:"",status:"",hasImages:"",submitted:"",closed:"" });
  const exportMetadata = () => {
    const headings = ["Cell Key","RCell ID","Sector","Band","Tower","Site","Assignment","RRU Type","Antenna Type","Image Count","Closed Date","Rigger"];
    const body = rows.map((cell) => [cell.databaseKey,cell.rcell_id,cell.sector,cell.band,cell.tower_id,cell.sitename,cell.assignment_id,cell.rru_type,cell.antenna_type,imageCount(cell),cell.closed_datetime??cell.closed_date,cell.rigger_name].map(csvCell).join(","));
    const blob = new Blob(["\uFEFF", headings.map(csvCell).join(","), "\r\n", body.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const anchor = document.createElement("a"); anchor.href = URL.createObjectURL(blob); anchor.download = "cells-metadata.csv"; anchor.click(); URL.revokeObjectURL(anchor.href);
  };
  const toggleSort = (key: Column) => setSort((current) => ({ key, direction: current.key === key ? current.direction === 1 ? -1 : 1 : 1 }));
  return <div className="space-y-5" aria-busy={pending}>
    <PageHeader title="Cells" description="Monitor Cell and sector-band information submitted by riggers through the mobile application." actions={<div className="flex flex-wrap gap-2">
      <button onClick={() => startTransition(() => router.refresh())} className="action-button" disabled={pending}><RefreshCw className={`size-4 ${pending?"animate-spin":""}`} aria-hidden="true"/>Refresh</button>
      <button onClick={exportMetadata} className="action-button"><Download className="size-4" aria-hidden="true"/>Export Metadata</button>
      <button onClick={() => setSettings(!settings)} aria-expanded={settings} className="action-button"><Columns3 className="size-4" aria-hidden="true"/>Column Settings</button>
    </div>}/>
    {settings?<section className="rounded-2xl border bg-white p-4" aria-label="Column settings"><div className="flex flex-wrap gap-3">{columns.map((column)=><label key={column} className="inline-flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={visible.has(column)} onChange={()=>setVisible((current)=>{const next=new Set(current);if(next.has(column))next.delete(column);else next.add(column);return next;})}/>{column}</label>)}</div></section>:null}
    <section className="sticky top-16 z-10 rounded-2xl border bg-white p-4 shadow-sm" aria-labelledby="cell-filters"><h2 id="cell-filters" className="font-semibold">Search and filters</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {fields.map(([key,label,placeholder])=><label key={key} className={key==="q"?"text-sm font-medium sm:col-span-2":"text-sm font-medium"}>{label}<input className="field-control" placeholder={placeholder} value={filters[key]} onChange={(event)=>setFilters({...filters,[key]:event.target.value})}/></label>)}
      <Select label="Status" value={filters.status} set={(value)=>setFilters({...filters,status:value})} options={[["","All"],["completed","Completed"],["pending","Pending"]]}/>
      <Select label="Has Images" value={filters.hasImages} set={(value)=>setFilters({...filters,hasImages:value})} options={[["","All"],["yes","Yes"],["no","No"]]}/>
      <label className="text-sm font-medium">Submission Date<input type="date" className="field-control" value={filters.submitted} onChange={(event)=>setFilters({...filters,submitted:event.target.value})}/></label>
      <label className="text-sm font-medium">Closed Date<input type="date" className="field-control" value={filters.closed} onChange={(event)=>setFilters({...filters,closed:event.target.value})}/></label>
    </div><button onClick={reset} className="action-button mt-4"><RotateCcw className="size-4" aria-hidden="true"/>Reset</button></section>
    <p className="sr-only" aria-live="polite">{rows.length} Cell results.</p>
    {rows.length?<CellResults rows={rows} visible={visible} toggleSort={toggleSort}/>:<Empty filtered={result.rows.length>0} reset={reset}/>}
    <nav aria-label="Cell pagination" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4"><p className="text-sm text-slate-600">Showing {rows.length} of {result.rows.length} records from this bounded page.</p><div className="flex gap-2">{cursor?<Link className="action-button" href="/home/cells">First page</Link>:null}{result.nextCursor?<Link className="action-button" href={`/home/cells?cursor=${encodeURIComponent(result.nextCursor)}`}>Next page</Link>:null}</div></nav>
  </div>;
}

function CellResults({rows,visible,toggleSort}:{rows:CellRecord[];visible:Set<Column>;toggleSort:(key:Column)=>void}) {
  const definitions: [Column,string,(cell:CellRecord)=>unknown][]=[["key","Cell Key",c=>c.databaseKey],["rcell","RCell ID",c=>c.rcell_id],["sector","Sector",c=>c.sector],["band","Band",c=>c.band],["tower","Tower",c=>c.tower_id],["site","Site",c=>c.sitename],["assignment","Assignment",c=>c.assignment_id],["rru","RRU Type",c=>c.rru_type],["antenna","Antenna Type",c=>c.antenna_type],["images","Image Count",imageCount],["closed","Closed Date",c=>date(c.closed_datetime??c.closed_date)],["rigger","Rigger",c=>c.rigger_name]];
  return <section aria-label="Cell results"><div className="hidden max-h-[65vh] overflow-auto rounded-2xl border bg-white shadow-sm lg:block"><table className="w-full min-w-[1300px] text-left text-sm"><thead className="sticky top-0 z-[1] bg-slate-50"><tr>{definitions.filter(([key])=>visible.has(key)).map(([key,label])=><th key={key} className="border-b px-3 py-3"><button className="font-semibold focus-visible:ring-2 focus-visible:ring-indigo-500" onClick={()=>toggleSort(key)}>{label}</button></th>)}<th className="border-b px-3 py-3">Actions</th></tr></thead><tbody className="divide-y">{rows.map((cell)=><tr key={cell.databaseKey} className="hover:bg-indigo-50/40">{definitions.filter(([key])=>visible.has(key)).map(([key,,read])=><td key={key} className="max-w-48 break-words px-3 py-3">{display(read(cell))}</td>)}<td className="px-3 py-2"><Actions cell={cell}/></td></tr>)}</tbody></table></div>
  <div className="grid gap-4 lg:hidden">{rows.map((cell)=><article className="rounded-2xl border bg-white p-4 shadow-sm" key={cell.databaseKey}><h3 className="break-words font-semibold">{display(cell.rcell_id)}</h3><p className="mt-1 text-sm text-slate-500">Sector {display(cell.sector)} · {display(cell.band)}</p><dl className="mt-4 grid grid-cols-2 gap-3">{definitions.filter(([key])=>!["rcell","sector","band"].includes(key)).map(([key,label,read])=><div key={key}><dt className="text-xs uppercase text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm">{display(read(cell))}</dd></div>)}</dl><div className="mt-4"><Actions cell={cell}/></div></article>)}</div></section>;
}
function Actions({cell}:{cell:CellRecord}) { const assignment=text(cell.assignment_id),tower=text(cell.tower_id);return <div className="flex min-w-48 flex-wrap gap-x-3"><Link className="row-link" href={`/home/cells/${encodeURIComponent(cell.databaseKey)}`}><Eye className="size-4" aria-hidden="true"/>View Cell</Link>{tower?<Link className="row-link" href={`/home/towers?${new URLSearchParams({q:tower})}`}>Open Tower</Link>:null}{assignment?<Link className="row-link" href={`/home/assignment?${new URLSearchParams({q:assignment})}`}>Open Assignment</Link>:null}</div>; }
function Select({label,value,set,options}:{label:string;value:string;set:(value:string)=>void;options:[string,string][]}) { return <label className="text-sm font-medium">{label}<select className="field-control" value={value} onChange={(event)=>set(event.target.value)}>{options.map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></label>; }
function Empty({filtered,reset}:{filtered:boolean;reset:()=>void}) { return <section className="rounded-2xl border border-dashed bg-white p-10 text-center"><Search className="mx-auto size-10 text-indigo-600" aria-hidden="true"/><h2 className="mt-3 font-semibold">{filtered?"No Search Results":"No Cells"}</h2><p className="mt-2 text-sm text-slate-600">{filtered?"No Cells match the current filters.":"No Cell records were returned by this bounded repository read."}</p>{filtered?<button className="action-button mx-auto mt-4" onClick={reset}>Reset filters</button>:null}</section>; }
