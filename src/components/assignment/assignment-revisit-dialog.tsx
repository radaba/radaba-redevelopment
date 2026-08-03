"use client";

import { useCallback, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { isCompletedAssignment } from "@/features/assignment/assignment-command-contract";
import type { AssignmentListItem } from "@/features/assignment/assignment-types";
import { AssignmentDialogShell } from "./assignment-dialog-shell";

export function AssignmentRevisitDialog({ row }: { row: AssignmentListItem }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const close = useCallback(() => {
    if (!pending) setOpen(false);
  }, [pending]);
  if (!row.assignment_id || !isCompletedAssignment(row)) return null;
  const valid = Boolean(reason.trim()) && reason.trim().length <= 2000;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || pending || !row.assignment_id) return;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/assignments/${encodeURIComponent(row.assignment_id)}/revisit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ reason: reason.trim() }),
        },
      );
      const body = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        if (response.status === 401)
          throw new Error("Your session expired. Sign in and try again.");
        if (response.status === 403)
          throw new Error("You do not have permission to revisit this Assignment.");
        if (response.status === 409)
          throw new Error(body.message || "Only completed assignments can be revisited.");
        throw new Error(body.error || body.message || "Assignment could not be revisited.");
      }
      setReason("");
      setOpen(false);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Assignment could not be revisited.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMessage("");
          setOpen(true);
        }}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-indigo-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <RotateCcw aria-hidden="true" className="size-4" />
        Revisit Assignment
      </button>
      {open ? (
        <AssignmentDialogShell
          title="Revisit Assignment"
          description="Reopen this completed Assignment for additional work."
          close={close}
        >
          <form onSubmit={submit} className="mt-6 space-y-5">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              <p>This assignment has already been completed.</p>
              <p className="mt-2">
                Revisiting it will reopen the assignment so additional work can be performed.
              </p>
              <p className="mt-2">The assignment history will be preserved.</p>
              <p className="mt-2 font-semibold">This action cannot be undone automatically.</p>
            </div>
            <label
              className="block text-sm font-medium text-slate-700"
              htmlFor="assignment-revisit-reason"
            >
              Reason <span aria-hidden="true">*</span>
              <textarea
                id="assignment-revisit-reason"
                required
                maxLength={2000}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                aria-describedby="assignment-revisit-reason-help"
                placeholder="Please enter the reason for revisiting this assignment..."
                className="mt-1.5 min-h-28 w-full rounded-xl border border-slate-300 p-3 outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
              />
            </label>
            <div
              id="assignment-revisit-reason-help"
              className="flex justify-between gap-3 text-xs text-slate-500"
            >
              <span>A reason is required and becomes part of the Assignment history.</span>
              <span>{reason.length}/2000</span>
            </div>
            {message ? (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {message}
              </p>
            ) : null}
            <p aria-live="polite" className="sr-only">
              {pending ? "Revisiting Assignment" : message}
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
                disabled={!valid || pending}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-700 px-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw aria-hidden="true" className="size-4" />
                {pending ? "Revisiting…" : "Revisit Assignment"}
              </button>
            </div>
          </form>
        </AssignmentDialogShell>
      ) : null}
    </>
  );
}
