"use client";

import { useState } from "react";
import type { AssignmentDashboardData, DashboardPerson, DashboardPoint } from "@/features/assignment/assignment-dashboard-metrics";

const colors = ["#4338ca", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#475569"];
const personPoint = (person: DashboardPerson): DashboardPoint => ({ label: person.name, value: person.total });

export default function AssignmentDashboardCharts({ data }: { data: Omit<AssignmentDashboardData, "recentAssignments" | "recentCompletions" | "recentRevisits"> }) {
  const [trend, setTrend] = useState<"created" | "completed" | "weekly" | "monthly">("created");
  const trends = {
    created: { title: "Daily assignments · last 30 days in range", points: data.dailyAssignments.slice(-30) },
    completed: { title: "Daily completions · last 30 days in range", points: data.dailyCompleted.slice(-30) },
    weekly: { title: "Weekly completion trend", points: data.weeklyCompleted },
    monthly: { title: "Monthly completion trend", points: data.monthlyCompleted },
  };
  return <div className="space-y-5">
    <section aria-labelledby="assignment-trends" className="rounded-xl border border-slate-200 bg-white shadow-sm"><header className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><h2 id="assignment-trends" className="text-base font-semibold text-slate-950">Assignment trends</h2><p className="mt-1 text-xs text-slate-500">Creation and completion volume within the selected cohort.</p></div><div className="flex max-w-full overflow-x-auto rounded-lg bg-slate-100 p-1" aria-label="Trend view">{[["created","Created"],["completed","Completed"],["weekly","Weekly"],["monthly","Monthly"]].map(([key,label]) => <button key={key} type="button" aria-pressed={trend===key} onClick={() => setTrend(key as keyof typeof trends)} className={`min-h-9 whitespace-nowrap rounded-md px-3 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-indigo-500 ${trend===key?"bg-white text-indigo-800 shadow-sm":"text-slate-600"}`}>{label}</button>)}</div></header><div className="p-4 sm:p-5"><DashboardLineChart title={trends[trend].title} data={trends[trend].points} embedded /></div></section>
    <section aria-labelledby="distribution-analytics" className="space-y-3"><div><h2 id="distribution-analytics" className="text-base font-semibold text-slate-950">Distribution and concentration</h2><p className="mt-1 text-xs text-slate-500">Status, SLA, aging, category, and current-assignee workload.</p></div><div className="grid gap-4 xl:grid-cols-2"><DashboardDonutChart title="Assignment status distribution" data={data.status} /><DashboardDonutChart title="SLA status distribution" data={data.slaSummary} /><DashboardBarChart title="Assignment aging buckets (days)" data={data.agingBuckets} /><DashboardBarChart title="Top categories by assignments" data={data.categories} /><DashboardBarChart title="Top Coordinators by assignments" data={data.coordinators.map(personPoint)} /><DashboardBarChart title="Top Riggers by assignments" data={data.riggers.map(personPoint)} /></div></section>
  </div>;
}

export function DashboardBarChart({ title, data, maximum = 10 }: { title: string; data: DashboardPoint[]; maximum?: number }) {
  const rows = data.slice(0, maximum), max = Math.max(1, ...rows.map((item) => item.value));
  return <ChartFrame title={title} data={rows}><div className="space-y-2" role="img" aria-label={`${title} bar chart`}>{rows.map((item, index) => <div key={`${item.label}-${index}`} className="grid grid-cols-[minmax(6rem,10rem)_1fr_2.5rem] items-center gap-2 text-xs"><span className="truncate" title={item.label}>{item.label}</span><span className="h-5 overflow-hidden rounded bg-slate-100"><span className="block h-full rounded" style={{ width: `${item.value / max * 100}%`, backgroundColor: colors[index % colors.length] }} /></span><strong className="text-right">{item.value}</strong></div>)}</div></ChartFrame>;
}

export function DashboardLineChart({ title, data, embedded = false }: { title: string; data: DashboardPoint[]; embedded?: boolean }) {
  const width = 640, height = 180, pad = 24, max = Math.max(1, ...data.map((item) => item.value));
  const points = data.map((item, index) => `${pad + index * ((width - pad * 2) / Math.max(1, data.length - 1))},${height - pad - item.value / max * (height - pad * 2)}`).join(" ");
  const chart=<><div className="mb-3 flex items-end justify-between gap-3"><h3 className="text-sm font-semibold text-slate-950">{title}</h3><p className="text-xs text-slate-500">Peak <strong className="text-slate-800">{max}</strong></p></div><svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label={`${title} line chart`}><title>{title}</title>{[0.25,0.5,0.75,1].map((ratio)=><line key={ratio} x1={pad} y1={height-pad-ratio*(height-pad*2)} x2={width-pad} y2={height-pad-ratio*(height-pad*2)} stroke="#e2e8f0" strokeDasharray="4 4" />)}<line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#94a3b8" /><polyline fill="none" stroke="#4338ca" strokeWidth="3" strokeLinejoin="round" points={points} />{data.map((item, index) => <circle key={`${item.label}-${index}`} cx={pad + index * ((width - pad * 2) / Math.max(1, data.length - 1))} cy={height - pad - item.value / max * (height - pad * 2)} r="4" fill="#4338ca"><title>{`${item.label}: ${item.value}`}</title></circle>)}</svg></>;
  return embedded?<div>{data.length?<>{chart}<AccessibleData title={title} data={data}/></>:<p className="py-12 text-center text-sm text-slate-500">No data for this range.</p>}</div>:<ChartFrame title={title} data={data}>{chart}</ChartFrame>;
}

export function DashboardDonutChart({ title, data }: { title: string; data: DashboardPoint[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0), radius = 54, circumference = 2 * Math.PI * radius;
  return <ChartFrame title={title} data={data}><div className="grid items-center gap-4 sm:grid-cols-[12rem_1fr]"><svg viewBox="0 0 140 140" className="mx-auto size-44 -rotate-90" role="img" aria-label={`${title} doughnut chart`}><title>{title}</title><circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="22" />{data.map((item, index) => { const length = total ? item.value / total * circumference : 0, current = total ? data.slice(0, index).reduce((sum, entry) => sum + entry.value, 0) / total * circumference : 0; return <circle key={`${item.label}-${index}`} cx="70" cy="70" r={radius} fill="none" stroke={colors[index % colors.length]} strokeWidth="22" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-current}><title>{`${item.label}: ${item.value}`}</title></circle>; })}</svg><ul className="space-y-2 text-sm">{data.map((item, index) => <li key={`${item.label}-${index}`} className="flex items-center justify-between gap-3"><span className="flex min-w-0 items-center gap-2"><span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} /><span className="truncate">{item.label}</span></span><strong>{item.value}</strong></li>)}</ul></div></ChartFrame>;
}

function ChartFrame({ title, data, children }: { title: string; data: DashboardPoint[]; children: React.ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><h3 className="text-sm font-semibold text-slate-950">{title}</h3><div className="mt-4">{data.length ? children : <p className="py-12 text-center text-sm text-slate-500">No data for this range.</p>}</div>{data.length?<AccessibleData title={title} data={data}/>:null}</section>;
}

function AccessibleData({title,data}:{title:string;data:DashboardPoint[]}) { return <details className="mt-4 text-xs"><summary className="flex min-h-10 cursor-pointer items-center rounded font-semibold text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500">Accessible chart data</summary><div className="overflow-x-auto"><table className="mt-2 w-full min-w-64 text-left"><caption className="sr-only">Data for {title}</caption><thead><tr><th scope="col" className="py-1">Label</th><th scope="col" className="py-1 text-right">Count</th></tr></thead><tbody>{data.map((item,index)=><tr key={`${item.label}-${index}`}><td className="border-t py-1">{item.label}</td><td className="border-t py-1 text-right tabular-nums">{item.value}</td></tr>)}</tbody></table></div></details>; }
