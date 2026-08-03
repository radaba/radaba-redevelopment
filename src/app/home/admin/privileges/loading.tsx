export default function PrivilegesLoading() {
  return (
    <div role="status" aria-label="Loading privileges" aria-busy="true" className="space-y-4">
      <div className="flex justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-40 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
        </div>
        <div className="h-11 w-28 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse rounded-2xl bg-white motion-reduce:animate-none"
          />
        ))}
      </div>
      <div className="h-36 animate-pulse rounded-2xl bg-white motion-reduce:animate-none" />
      <div className="h-12 animate-pulse rounded-xl bg-white motion-reduce:animate-none" />
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-36 animate-pulse rounded-2xl bg-white motion-reduce:animate-none"
        />
      ))}
      <span className="sr-only">Loading privilege access controls</span>
    </div>
  );
}
