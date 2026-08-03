'use client';

import { TriangleAlert } from "lucide-react";

export default function ProfileError({ reset }: { error: Error; reset: () => void }) {
  return <section role="alert" className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm"><TriangleAlert aria-hidden="true" className="size-7 text-rose-600"/><h1 className="mt-4 text-xl font-semibold text-slate-950">Profile could not be loaded</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">The profile workspace is temporarily unavailable. Check your connection and access, then try again. No account data was changed.</p><button type="button" onClick={reset} className="mt-5 min-h-11 rounded-xl bg-indigo-700 px-4 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-indigo-500">Try again</button></section>;
}