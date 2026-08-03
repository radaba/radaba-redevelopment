"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, CirclePause, Play, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ASSIGNMENT_TRANSITIONS,
  availableAssignmentTransitions,
  type AssignmentTransitionAction,
} from "@/features/assignment/assignment-workflow";
import type { AssignmentListItem } from "@/features/assignment/assignment-types";
import { AssignmentDialogShell } from "./assignment-dialog-shell";

const actions = {
  accept: {
    label: "Accept Assignment",
    description: "Confirm that this Assignment has been accepted.",
    icon: CheckCircle2,
    primary: true,
  },
  start: {
    label: "Start Work",
    description: "Confirm that field work has started.",
    icon: Play,
    primary: true,
  },
  resume: {
    label: "Resume Work",
    description: "Resume work on this Assignment and return it to On Progress.",
    icon: RotateCcw,
    primary: true,
  },
  complete: {
    label: "Complete Assignment",
    description: "Confirm that all work for this Assignment has been completed.",
    icon: CheckCircle2,
    primary: true,
  },
  pause: {
    label: "Pause Work",
    description: "Confirm that active field work should be paused.",
    icon: CirclePause,
    primary: false,
  },
} satisfies Record<
  AssignmentTransitionAction,
  { label: string; description: string; icon: typeof Play; primary: boolean }
>;

export function AssignmentWorkflowActions({
  row,
  towerId,
}: {
  row: AssignmentListItem;
  towerId?: string | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<AssignmentTransitionAction | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const available = availableAssignmentTransitions(row);
  const close = useCallback(() => {
    if (!pending) setSelected(null);
  }, [pending]);
  if (!row.assignment_id || !available.length) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || pending || !row.assignment_id) return;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/assignments/${encodeURIComponent(row.assignment_id)}/transition`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ action: selected }),
        },
      );
      const body = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        if (response.status === 401)
          throw new Error("Your session expired. Sign in and try again.");
        if (response.status === 403)
          throw new Error("You do not have permission to update this Assignment.");
        if (response.status === 409)
          throw new Error(
            body.error ||
              body.message ||
              "This Assignment changed. Refresh and review its current state.",
          );
        throw new Error(body.error || body.message || "The workflow action could not be applied.");
      }
      setSelected(null);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "The workflow action could not be applied.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {available.map((action) => {
          const config = actions[action];
          const Icon = config.icon;
          return (
            <button
              key={action}
              type="button"
              onClick={() => {
                setMessage("");
                setSelected(action);
              }}
              className={
                config.primary
                  ? "inline-flex min-h-10 items-center gap-2 rounded-xl bg-indigo-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  : "inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              }
            >
              <Icon aria-hidden="true" className="size-4" />
              {config.label}
            </button>
          );
        })}
      </div>
      {selected ? (
        <AssignmentDialogShell
          title={actions[selected].label}
          description={actions[selected].description}
          close={close}
        >
          <form onSubmit={submit} className="mt-6 space-y-5">
            <div
              className={
                selected === "complete"
                  ? "rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                  : "rounded-xl border border-slate-200 bg-slate-50 p-4"
              }
            >
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <WorkflowValue label="Assignment ID" value={row.assignment_id} />
                {towerId ? <WorkflowValue label="Tower ID" value={towerId} /> : null}
                <WorkflowValue label="Current status" value={row.assignment_state || "Unknown"} />
                <WorkflowValue label="Target status" value={ASSIGNMENT_TRANSITIONS[selected].to} />
              </dl>
              <p className="mt-4 text-sm text-slate-600">
                The latest Assignment state will be verified before this action is applied.
              </p>
            </div>
            {message ? (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {message}
              </p>
            ) : null}
            <p aria-live="polite" className="sr-only">
              {pending ? `${actions[selected].label} in progress` : message}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="min-h-11 rounded-xl border border-slate-300 px-4 font-semibold disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className={
                  selected === "complete"
                    ? "min-h-11 rounded-xl bg-emerald-700 px-4 font-semibold text-white disabled:opacity-40"
                    : "min-h-11 rounded-xl bg-indigo-700 px-4 font-semibold text-white disabled:opacity-40"
                }
              >
                {pending ? "Applying…" : actions[selected].label}
              </button>
            </div>
          </form>
        </AssignmentDialogShell>
      ) : null}
    </>
  );
}

function WorkflowValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
