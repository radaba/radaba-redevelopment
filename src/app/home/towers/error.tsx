"use client";
export default function TowersError({ reset }: { reset: () => void }) {
  return <section aria-labelledby="tower-error" className="rounded-2xl border border-red-200 bg-red-50 p-6"><h1 id="tower-error" className="text-xl font-semibold text-red-950">Towers are unavailable</h1><p className="mt-2 text-sm text-red-800">The directory could not be loaded. No data was changed.</p><button onClick={reset} className="mt-4 min-h-11 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-red-500">Try again</button></section>;
}

