"use client";

import { useRouter } from "next/navigation";
import { Printer, RefreshCw } from "lucide-react";
import { useTransition } from "react";

const actionClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:bg-slate-50 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export function AssignmentDetailActions() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
        className={actionClass}
      >
        <RefreshCw
          aria-hidden="true"
          className={`size-4 ${pending ? "animate-spin motion-reduce:animate-none" : ""}`}
        />
        Refresh
      </button>
      <button type="button" onClick={() => window.print()} className={actionClass}>
        <Printer aria-hidden="true" className="size-4" />
        Print
      </button>
      <span className="sr-only" aria-live="polite">
        {pending ? "Refreshing Assignment details" : ""}
      </span>
    </div>
  );
}
