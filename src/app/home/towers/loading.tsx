export default function TowersLoading() {
  return <section aria-label="Loading Towers" aria-busy="true" className="space-y-4"><div className="h-16 animate-pulse rounded-2xl bg-slate-200 motion-reduce:animate-none" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[1,2,3,4].map((item)=><div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-200 motion-reduce:animate-none" />)}</div><div className="h-80 animate-pulse rounded-2xl bg-slate-200 motion-reduce:animate-none" /><span className="sr-only">Loading Tower records</span></section>;
}

