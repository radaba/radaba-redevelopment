export default function AssignmentDetailLoading() {
  return (
    <div
      role="status"
      aria-label="Loading Assignment details"
      className="space-y-4 motion-safe:animate-pulse"
    >
      <div className="h-4 w-64 rounded bg-slate-100" />
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:justify-between">
        <div className="space-y-3">
          <div className="h-8 w-72 rounded bg-slate-200" />
          <div className="h-6 w-96 max-w-full rounded bg-slate-100" />
        </div>
        <div className="h-10 w-64 rounded-xl bg-slate-100" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="h-20 rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-52 rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-44 rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
      </div>
      <span className="sr-only">
        Loading Assignment summary, information, timeline, and sidebar
      </span>
    </div>
  );
}
