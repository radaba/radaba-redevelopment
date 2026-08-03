"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section aria-labelledby="admin-error" className="rounded-2xl border border-red-200 bg-red-50 p-6"><h1 id="admin-error" className="text-xl font-semibold text-red-950">Administration could not be loaded</h1><p className="mt-2 text-sm text-red-800">No data was changed. Try the request again.</p><button type="button" onClick={reset} className="mt-5 min-h-10 rounded-lg bg-red-700 px-4 font-semibold text-white focus-visible:ring-2 focus-visible:ring-red-500">Try again</button></section>;
}
