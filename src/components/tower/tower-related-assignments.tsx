import Link from "next/link";
import { AssignmentStatusBadge } from "@/components/assignment/assignment-status-badge";
import { isTerminalAssignment } from "@/features/assignment/assignment-command-contract";
import type { AssignmentListItem } from "@/features/assignment/assignment-types";
import type { Tower } from "@/features/tower/tower-types";

const text = (value: string | null) => value || "—";
const assignmentDate = (row: AssignmentListItem) =>
  row.created_datetime || row.created_date || "—";

export function TowerRelatedAssignments({
  tower,
  rows,
  failed,
}: {
  tower: Tower;
  rows: AssignmentListItem[];
  failed: boolean;
}) {
  const hasTowerId =
    tower.tower_id !== null &&
    tower.tower_id !== undefined &&
    String(tower.tower_id).trim() !== "";
  const terminal = rows.filter((row) =>
    isTerminalAssignment({
      assignment_state: row.assignment_state,
      assignment_status: row.assignment_status,
    }),
  ).length;
  const latest = rows.find((row) => row.created_datetime || row.created_date);

  return (
    <section
      aria-labelledby="related-assignments"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 id="related-assignments" className="text-base font-semibold">
        Related Assignments
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Recent Assignments associated with this Tower ID.
      </p>
      {!hasTowerId ? (
        <RelatedState
          title="Related Assignments unavailable"
          message="This Tower record has no Tower ID, so related Assignments cannot be resolved."
        />
      ) : failed ? (
        <RelatedState
          title="Related Assignments unavailable"
          message="The recent related records could not be loaded. The Tower record remains available and no data was changed."
        />
      ) : rows.length === 0 ? (
        <RelatedState
          title="No related Assignments"
          message="No Assignments were found in the bounded recent-record query for this Tower ID."
        />
      ) : (
        <>
          <dl
            aria-label="Bounded Related Assignment summary"
            className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            <Summary label="Records shown" value={String(rows.length)} />
            <Summary label="Active records shown" value={String(rows.length - terminal)} />
            <Summary label="Terminal records shown" value={String(terminal)} />
            <Summary
              label="Latest Assignment date"
              value={latest ? assignmentDate(latest) : "—"}
            />
          </dl>
          <DesktopTable rows={rows} />
          <MobileCards rows={rows} />
        </>
      )}
    </section>
  );
}

function DesktopTable({ rows }: { rows: AssignmentListItem[] }) {
  return (
    <div className="mt-4 hidden overflow-hidden rounded-xl border border-slate-200 lg:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              {[
                "Assignment ID",
                "Category",
                "RNO",
                "Rigger",
                "Coordinator",
                "Status",
                "State",
                "Assignment Time",
                "Finished Time",
                "Action",
              ].map((label) => (
                <th key={label} scope="col" className="border-b px-3 py-3 font-semibold">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="max-w-52 break-words px-3 py-3 font-semibold">
                  {text(row.assignment_id)}
                </td>
                <td className="px-3 py-3">{text(row.assignment_category)}</td>
                <td className="px-3 py-3">{text(row.rno_name)}</td>
                <td className="px-3 py-3">{text(row.rigger_name)}</td>
                <td className="px-3 py-3">{text(row.coordinator_name)}</td>
                <td className="px-3 py-3">
                  <AssignmentStatusBadge status={row.assignment_status} />
                </td>
                <td className="px-3 py-3">{text(row.assignment_state)}</td>
                <td className="whitespace-nowrap px-3 py-3">{assignmentDate(row)}</td>
                <td className="whitespace-nowrap px-3 py-3">
                  {row.closed_datetime || row.closed_date || "—"}
                </td>
                <td className="px-3 py-3">
                  <AssignmentLink row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MobileCards({ rows }: { rows: AssignmentListItem[] }) {
  return (
    <div className="mt-4 grid gap-3 lg:hidden">
      {rows.map((row) => (
        <article key={row.key} className="rounded-xl border border-slate-200 p-4">
          <h3 className="break-all font-semibold">{text(row.assignment_id)}</h3>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Field label="Category" value={row.assignment_category} />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Status and state
              </dt>
              <dd className="mt-1 flex flex-wrap items-center gap-2">
                <AssignmentStatusBadge status={row.assignment_status} />
                <span>{text(row.assignment_state)}</span>
              </dd>
            </div>
            <Field label="Rigger" value={row.rigger_name} />
            <Field label="Coordinator" value={row.coordinator_name} />
            <Field label="Assignment date" value={assignmentDate(row)} />
          </dl>
          <div className="mt-3">
            <AssignmentLink row={row} />
          </div>
        </article>
      ))}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words">{text(value)}</dd>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words font-semibold">{value}</dd>
    </div>
  );
}

function RelatedState({ title, message }: { title: string; message: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-center">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{message}</p>
    </div>
  );
}

function AssignmentLink({ row }: { row: AssignmentListItem }) {
  return (
    <Link
      href={`/home/assignment/${encodeURIComponent(row.key)}`}
      aria-label={`View Assignment ${text(row.assignment_id)}`}
      className="inline-flex min-h-11 items-center font-semibold text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      View Assignment
    </Link>
  );
}
