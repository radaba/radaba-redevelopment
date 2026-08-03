"use client";

export default function AssignmentError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section aria-labelledby="assignment-error" className="rounded-2xl border border-red-200 bg-red-50 p-6"><h1 id="assignment-error" className="text-xl font-semibold text-red-950">Assignments could not be loaded</h1><p className="mt-2 text-sm text-red-800">The repository is temporarily unavailable. No data was changed.</p><button type="button" onClick={reset} className="mt-5 min-h-10 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white outline-none hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">Try again</button></section>;
}
