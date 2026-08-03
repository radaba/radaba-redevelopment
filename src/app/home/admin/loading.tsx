export default function AdminLoading() {
  return <div role="status" aria-label="Loading administration" className="animate-pulse space-y-6"><div className="h-10 w-64 rounded bg-slate-200" /><div className="h-28 rounded-2xl bg-white" /><div className="space-y-3 rounded-2xl bg-white p-5">{[1,2,3,4,5].map((row) => <div key={row} className="h-10 rounded bg-slate-100" />)}</div><span className="sr-only">Loading administrator data</span></div>;
}
