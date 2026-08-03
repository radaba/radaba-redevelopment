export default function AssignmentDashboardLoading() {
  return <div className="animate-pulse space-y-5 motion-reduce:animate-none" aria-label="Loading Assignment dashboard" role="status">
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:justify-between"><div className="space-y-3"><div className="h-3 w-32 rounded bg-indigo-100"/><div className="h-8 w-64 rounded bg-slate-200"/><div className="h-4 w-96 max-w-full rounded bg-slate-100"/></div><div className="h-11 w-56 rounded-lg bg-slate-200"/></div>
    <div className="h-56 rounded-xl border border-slate-200 bg-white"/>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((item)=><div key={item} className="h-36 rounded-xl border border-slate-200 bg-white"/>)}</div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map((item)=><div key={item} className="h-24 rounded-xl border border-slate-200 bg-white"/>)}</div>
    <div className="h-[24rem] rounded-xl border border-slate-200 bg-white"/>
    <span className="sr-only">Loading dashboard filters, metrics, charts, workload, and recent activity</span>
  </div>;
}
