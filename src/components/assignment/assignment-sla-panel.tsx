import type { AssignmentSlaEvaluation } from "@/features/assignment/assignment-sla-contract";
import { AssignmentSlaBadge, formatSlaDuration } from "./assignment-sla-badge";

export function AssignmentSlaPanel({ sla }: { sla: AssignmentSlaEvaluation }) {
  const fields = [
    ["Current aging", formatSlaDuration(sla.assignmentAgeMs)],
    ["Current status age", formatSlaDuration(sla.statusAgeMs)],
    ["Target SLA", formatSlaDuration(sla.targetMs)],
    ["Remaining time", formatSlaDuration(sla.remainingMs)],
    ["Overdue duration", sla.overdueMs ? formatSlaDuration(sla.overdueMs) : "Not overdue"],
    ["Working duration", formatSlaDuration(sla.workingDurationMs)],
    ["Pause duration", formatSlaDuration(sla.pauseDurationMs)],
    ["Time since last activity", formatSlaDuration(sla.timeSinceLastActivityMs)],
  ];
  return (
    <section aria-labelledby="assignment-sla" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 id="assignment-sla" className="text-sm font-semibold">SLA &amp; aging</h2>
        <AssignmentSlaBadge sla={sla} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        {fields.map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="font-medium text-slate-900">{value}</dd></div>)}
      </dl>
      {sla.escalationReasons.length ? <p className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-800"><strong>Escalation ready:</strong> {sla.escalationReasons.join("; ")}. No notification is sent.</p> : null}
      {sla.limitations.length ? <ul className="mt-3 list-disc pl-4 text-xs text-slate-500">{sla.limitations.map((item) => <li key={item}>{item}</li>)}</ul> : null}
    </section>
  );
}
