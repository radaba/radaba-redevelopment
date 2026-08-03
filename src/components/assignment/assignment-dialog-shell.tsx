"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function AssignmentDialogShell({ title, description, close, children }: {
  title: string; description: string; close: () => void; children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const root = panel.current;
    root?.querySelector<HTMLElement>("input,select,textarea,button")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key !== "Tab" || !root) return;
      const items = [...root.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')];
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); previouslyFocused?.focus(); };
  }, [close]);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
    <div ref={panel} role="dialog" aria-modal="true" aria-labelledby="assignment-dialog-title" aria-describedby="assignment-dialog-description" className="max-h-[calc(100vh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><h2 id="assignment-dialog-title" className="text-xl font-semibold">{title}</h2><p id="assignment-dialog-description" className="mt-1 text-sm text-slate-600">{description}</p></div><button type="button" onClick={close} aria-label={`Close ${title}`} className="rounded-lg p-2 focus-visible:ring-2 focus-visible:ring-indigo-500"><X className="size-5" /></button></div>
      {children}
    </div>
  </div>;
}
