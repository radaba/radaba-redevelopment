"use client";
import { useCallback, useState } from "react";
import { Lock, UserRoundCog } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { AssignmentListItem } from "@/features/assignment/assignment-types";
import {
  isCompletedAssignment,
  type AssignmentReference,
} from "@/features/assignment/assignment-command-contract";
import { AssignmentDialogShell } from "./assignment-dialog-shell";
import { AssignmentReferenceLookup } from "./assignment-reference-lookup";
import { assignmentRiggerBaseline } from "@/features/assignment/assignment-rigger-reassignment-contract";
export function AssignmentReassignRiggerDialog({
  row,
  assignmentKey,
  assignmentId,
}: {
  row: AssignmentListItem;
  assignmentKey: string;
  assignmentId: string;
}) {
  const router = useRouter(),
    pathname = usePathname(),
    [open, setOpen] = useState(false),
    [rigger, setRigger] = useState<AssignmentReference | null>(null),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  const close = useCallback(() => {
    if (!pending) setOpen(false);
  }, [pending]);
  if (!assignmentId) return null;
  if (isCompletedAssignment(row))
    return (
      <div
        className="max-w-sm"
        title="Rigger assignment cannot be changed because this assignment has been completed."
      >
        <span
          aria-label="Rigger locked because the Assignment is completed"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-600"
        >
          <Lock aria-hidden="true" className="size-4" />
          Rigger Locked
        </span>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Rigger assignment cannot be changed because this assignment has been completed.
        </p>
      </div>
    );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rigger || pending) return;
    setPending(true);
    setMessage("");
    try {
      const requestUrl = `/api/assignments/${encodeURIComponent(assignmentKey)}/rigger`;
      if (process.env.NODE_ENV === "development") {
        if (assignmentKey === assignmentId) throw new Error("invalid_assignment_key");
        console.info("assignment_reassignment_trace", {
          pathname,
          dialogAssignmentKey: assignmentKey,
          dialogAssignmentId: assignmentId,
          requestUrl,
        });
      }
      const response = await fetch(requestUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          assignmentId,
          riggerKey: rigger.key,
          expected: assignmentRiggerBaseline(row),
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        if (response.status === 401)
          throw new Error("Your session expired. Sign in and try again.");
        if (response.status === 403)
          throw new Error("You do not have permission to reassign this Assignment.");
        if (response.status === 409 && body.code === "ASSIGNMENT_COMPLETED")
          throw new Error(
            body.message ||
              "Rigger cannot be reassigned because the assignment has already been completed.",
          );
        if (body.code === "assignment_changed") {
          setOpen(false);
          setRigger(null);
          router.refresh();
          throw new Error(
            "This Assignment changed after the dialog was opened. The page has been refreshed. Reopen Reassign Rigger and try again.",
          );
        }
        if (body.code === "invalid_assignment_key")
          throw new Error(
            "The Assignment link is invalid. Return to the Assignment list and open it again.",
          );
        if (body.code === "transaction_conflict") {
          setOpen(false);
          setRigger(null);
          router.refresh();
          throw new Error(
            "The reassignment could not be committed because of a concurrent database update. The page has been refreshed. Reopen Reassign Rigger and try again.",
          );
        }
        if (body.code === "assignment_identity_mismatch")
          throw new Error("The Assignment identity changed. Refresh the page before reassigning.");
        if (body.code === "duplicate_assignment_id")
          throw new Error(
            "Multiple Assignment records use this Assignment ID. Reassignment is blocked until the duplicate is resolved.",
          );
        if (body.code === "ambiguous_rigger")
          throw new Error(
            "The selected rigger is not unique. Select a rigger using a verified account.",
          );
        if (body.code === "assignment-not-found")
          throw new Error("This Assignment no longer exists.");
        if (response.status === 409)
          throw new Error(
            body.error || "The reassignment could not be completed because the record changed.",
          );
        throw new Error(body.error || "Rigger could not be reassigned.");
      }
      setOpen(false);
      setRigger(null);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Rigger could not be reassigned.");
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
        aria-label={`Reassign rigger for ${assignmentId}`}
        className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <UserRoundCog className="size-4" />
        Reassign Rigger
      </button>
      {open ? (
        <AssignmentDialogShell
          title="Reassign Rigger"
          description="Only confirmed rigger fields and dependent composites will change."
          close={close}
        >
          <form onSubmit={submit} className="mt-6 space-y-5">
            <dl className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-500">Assignment ID</dt>
                <dd className="break-all font-semibold">{assignmentId}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Current rigger</dt>
                <dd>{row.rigger_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Current partner</dt>
                <dd>{row.company || "—"}</dd>
              </div>
            </dl>
            <AssignmentReferenceLookup
              label="New rigger"
              endpoint="/api/assignments/lookups/users?kind=rigger"
              value={rigger}
              onChange={setRigger}
            />
            {rigger?.secondary ? (
              <p className="text-sm text-slate-600">
                New rigger partner: <strong>{rigger.secondary}</strong>. The Assignment partner
                field remains unchanged.
              </p>
            ) : null}
            <p className="text-sm text-slate-600">
              Assignment ID, tower, dates, RNO, coordinator, category, status, evidence, and image
              totals remain unchanged.
            </p>
            {message ? (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {message}
              </p>
            ) : null}
            <p aria-live="polite" className="sr-only">
              {pending ? "Reassigning rigger" : message}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="min-h-11 rounded-lg border border-slate-300 px-4 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!rigger || pending}
                className="min-h-11 rounded-lg bg-indigo-700 px-4 font-semibold text-white disabled:opacity-40"
              >
                {pending ? "Reassigning…" : "Confirm reassignment"}
              </button>
            </div>
          </form>
        </AssignmentDialogShell>
      ) : null}
    </>
  );
}
