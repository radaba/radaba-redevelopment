"use client";
import { useCallback, useEffect, useState } from "react";
import { FilePlus2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AssignmentReference } from "@/features/assignment/assignment-command-contract";
import { AssignmentDialogShell } from "./assignment-dialog-shell";
import { AssignmentReferenceLookup } from "./assignment-reference-lookup";

export function AssignmentCreateDialog() {
  const router = useRouter(),
    [open, setOpen] = useState(false),
    [tower, setTower] = useState<AssignmentReference | null>(null),
    [rno, setRno] = useState<AssignmentReference | null>(null),
    [rigger, setRigger] = useState<AssignmentReference | null>(null),
    [coordinator, setCoordinator] = useState<AssignmentReference | null>(null);
  const [categories, setCategories] = useState<AssignmentReference[]>([]),
    [category, setCategory] = useState(""),
    [planDate, setPlanDate] = useState(""),
    [description, setDescription] = useState(""),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  const close = useCallback(() => {
    if (!pending) setOpen(false);
  }, [pending]);
  useEffect(() => {
    if (!open) return;
    fetch("/api/assignments/lookups/categories", { credentials: "same-origin" })
      .then(async (r) => {
        const b = await r.json();
        if (!r.ok) throw new Error(b.error);
        setCategories(b.data ?? []);
      })
      .catch(() => setMessage("Categories are unavailable. Try again."));
  }, [open]);
  const valid = Boolean(
    tower &&
    rno &&
    rigger &&
    coordinator &&
    category &&
    (!planDate || /^\d{4}-\d{2}-\d{2}$/.test(planDate)),
  );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || pending) return;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          towerKey: tower!.key,
          rnoKey: rno!.key,
          riggerKey: rigger!.key,
          coordinatorKey: coordinator!.key,
          category,
          planDate: planDate || undefined,
          description: description.trim() || undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        if (response.status === 409)
          throw new Error(
            "An active Assignment already exists for this tower. The existing Assignment was not modified.",
          );
        if (response.status === 401)
          throw new Error("Your session expired. Sign in and try again.");
        if (response.status === 403)
          throw new Error("You do not have permission to create Assignments.");
        throw new Error(body.error || "Assignment could not be created.");
      }
      setTower(null);
      setRno(null);
      setRigger(null);
      setCoordinator(null);
      setCategory("");
      setPlanDate("");
      setDescription("");
      setOpen(false);
      router.push("/home/assignment?page=1");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Assignment could not be created.");
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
        className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-indigo-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <FilePlus2 aria-hidden="true" className="size-4" />
        Create Assignment
      </button>
      {open ? (
        <AssignmentDialogShell
          title="Create Assignment"
          description="References are verified by the server before one complete Assignment is created."
          close={close}
        >
          <form onSubmit={submit} className="mt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <AssignmentReferenceLookup
                label="Tower"
                endpoint="/api/assignments/lookups/towers"
                value={tower}
                onChange={setTower}
              />
              <AssignmentReferenceLookup
                label="RNO"
                endpoint="/api/assignments/lookups/users?kind=rno"
                value={rno}
                onChange={setRno}
              />
              <AssignmentReferenceLookup
                label="Rigger"
                endpoint="/api/assignments/lookups/users?kind=rigger"
                value={rigger}
                onChange={setRigger}
              />
              <AssignmentReferenceLookup
                label="Coordinator"
                endpoint="/api/assignments/lookups/users?kind=coordinator"
                value={coordinator}
                onChange={setCoordinator}
              />
              <label className="text-sm font-medium text-slate-700">
                Category *
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.key} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Plan date
                <input
                  type="date"
                  value={planDate}
                  onChange={(e) => setPlanDate(e.target.value)}
                  className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3"
                />
              </label>
            </div>
            <label className="block text-sm font-medium text-slate-700">
              Description
              <textarea
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-300 p-3"
              />
            </label>
            {message ? (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {message}
              </p>
            ) : null}
            <p aria-live="polite" className="sr-only">
              {pending ? "Creating Assignment" : message}
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
                disabled={!valid || pending}
                className="min-h-11 rounded-lg bg-indigo-700 px-4 font-semibold text-white disabled:opacity-40"
              >
                {pending ? "Creating…" : "Create Assignment"}
              </button>
            </div>
          </form>
        </AssignmentDialogShell>
      ) : null}
    </>
  );
}
