import { assignmentStatusTone } from "@/features/assignment/assignment-status.mjs";

const toneClasses = {
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  gray: "bg-slate-100 text-slate-700 ring-slate-200",
} as const;

export function AssignmentStatusBadge({ status }: { status: string | null }) {
  const label = status || "Unknown";
  const tone = assignmentStatusTone(status) as keyof typeof toneClasses;
  return (
    <span
      aria-label={`Status: ${label}`}
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}
