import type { AssignmentSlaEvaluation } from "@/features/assignment/assignment-sla-contract";

const tone: Record<string, string> = {
  "On Track": "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Warning: "bg-amber-50 text-amber-900 ring-amber-300",
  Overdue: "bg-rose-50 text-rose-800 ring-rose-200",
  Escalated: "bg-red-100 text-red-900 ring-red-300",
  Unavailable: "bg-slate-100 text-slate-700 ring-slate-300",
  "Not Applicable": "bg-slate-50 text-slate-600 ring-slate-200",
};

export function AssignmentSlaBadge({ sla }: { sla?: AssignmentSlaEvaluation }) {
  const label = sla?.state ?? "Unavailable";
  return (
    <span
      aria-label={`SLA status: ${label}`}
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${tone[label]}`}
    >
      {label}
    </span>
  );
}

export function formatSlaDuration(value: number | null | undefined) {
  if (value === null || value === undefined) return "Unavailable";
  const hours = value / 3_600_000;
  return hours < 24 ? `${Math.round(hours * 10) / 10} hr` : `${Math.round(hours / 2.4) / 10} days`;
}
