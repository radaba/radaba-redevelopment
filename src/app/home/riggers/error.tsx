"use client";
export default function RiggersError({reset}:{reset:()=>void}){return <section className="rounded-2xl border border-red-200 bg-red-50 p-6"><h1 className="text-xl font-semibold">Riggers are unavailable</h1><p className="mt-2 text-sm">The bounded directory could not be loaded. No data was changed.</p><button onClick={reset} className="mt-4 min-h-11 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white focus-visible:ring-2">Try again</button></section>}

