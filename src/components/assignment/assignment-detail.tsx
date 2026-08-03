import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  ExternalLink,
  FileText,
  ImageIcon,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  assignmentTowerSpecificationStatus,
  type AssignmentDetail,
} from "@/features/assignment/assignment-detail";
import {
  formatAssignmentTimelineTimestamp,
} from "@/features/assignment/assignment-timeline";
import type { AssignmentListItem } from "@/features/assignment/assignment-types";
import type { AssignmentTimelineEvent } from "@/features/assignment/assignment-timeline";
import type { AssignmentSlaEvaluation } from "@/features/assignment/assignment-sla-contract";
import { AssignmentSlaPanel } from "./assignment-sla-panel";
import { isCompletedAssignment } from "@/features/assignment/assignment-command-contract";
import { AssignmentStatusBadge } from "./assignment-status-badge";
import { AssignmentReassignRiggerDialog } from "./assignment-reassign-rigger-dialog";
import { AssignmentDetailActions } from "./assignment-detail-actions";
import { AssignmentRevisitDialog } from "./assignment-revisit-dialog";
import { AssignmentTimeline } from "./assignment-timeline";
import { AssignmentWorkflowActions } from "./assignment-workflow-actions";
import { AssignmentPhotoEvidence } from "./assignment-photo-evidence";
import { AssignmentWorkExecution } from "./assignment-work-execution";
import { AssignmentDiscussion } from "./assignment-discussion";

// Legacy lifecycle adapter remains available as buildAssignmentTimeline for compatibility.
const surface = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const missing = "—";
const networkMissing = "Not available";
const networkGroups = [
  { title: "2G", labels: ["GSM 900", "GSM 1800"] },
  { title: "3G", labels: ["UMTS 900", "UMTS 2100"] },
  { title: "4G / LTE", labels: ["L700", "L850", "LTE 900", "LTE 1800", "LTE 2100", "L2300", "L2600"] },
] as const;
const networkDisplay = (value: unknown) =>
  value === null || value === undefined || (typeof value === "string" && !value.trim())
    ? networkMissing
    : String(value);
const snapshotDisplay = (value: unknown) =>
  value === null || value === undefined || (typeof value === "string" && !value.trim())
    ? "Not available"
    : String(value);

function dateTime(value: string | null) {
  return formatAssignmentTimelineTimestamp(value);
}

function dateOnly(value: string | null) {
  if (!value) return missing;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))));
}

function externalUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}
export function AssignmentDetailView({
  detail, row, canEditWorkExecution, showAdministratorDiagnostic, sla,
  activityEvents, activityUnavailableSources, auditCenterHref,
}: {
  detail: AssignmentDetail;
  row: AssignmentListItem;
  canEditWorkExecution: boolean;
  showAdministratorDiagnostic: boolean;
  sla: AssignmentSlaEvaluation;
  activityEvents: readonly AssignmentTimelineEvent[];
  activityUnavailableSources: readonly string[];
  auditCenterHref: string | null;
}) {
  const title = detail.assignmentId || detail.assignmentKey;
  const reportUrl = externalUrl(detail.reportUrl);
  const timestamps = [
    detail.createdDateTime,
    detail.acceptedDateTime,
    detail.checkinDateTime,
    detail.pausedDateTime,
    detail.completedDateTime,
    detail.rejectedDateTime,
    detail.closedDateTime,
    detail.lastRevisitAt,
  ].filter((value): value is string => Boolean(value));
  const lastUpdated = timestamps.sort((a, b) => b.localeCompare(a))[0] ?? null;
  const photoReadOnly = isCompletedAssignment(row);
  const towerSpecificationStatus = assignmentTowerSpecificationStatus(detail);
  const networkSections = networkGroups.map((group) => ({
    ...group,
    items: group.labels.map(
      (label) => detail.network.find((item) => item.label === label) ?? { label, value: undefined },
    ),
  }));
  return (
    <div className="space-y-4 motion-safe:animate-[detail-enter_200ms_ease-out] print:space-y-3">
      <nav
        aria-label="Assignment breadcrumb"
        className="flex flex-wrap items-center gap-2 text-sm text-slate-500 print:hidden"
      >
        <Link
          href="/home/assignment"
          className="rounded-md hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href="/home/assignment"
          className="rounded-md hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Assignment
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="max-w-full truncate font-medium text-slate-700">
          {title}
        </span>
      </nav>

      <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
            Engineering assignment
          </p>
          <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Assignment #{title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <AssignmentStatusBadge status={detail.state || detail.status} />
            <MetaBadge label="Partner" value={detail.company} />
            <MetaBadge label="Region" value={detail.region} />
            <MetaBadge label="Last updated" value={dateTime(lastUpdated)} />
            {detail.revisitCount > 0 ? (
              <MetaBadge label="Revisited" value={`x${detail.revisitCount}`} />
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AssignmentDetailActions />
          <div className="flex flex-wrap gap-2 print:hidden">
            <AssignmentWorkflowActions row={row} towerId={detail.towerId} />
            <AssignmentRevisitDialog row={row} />
            <AssignmentReassignRiggerDialog
              row={row}
              assignmentKey={detail.assignmentKey}
              assignmentId={detail.assignmentId!}
            />
          </div>
        </div>
      </header>

      <section aria-label="Assignment summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Summary icon={ClipboardList} label="Status" value={detail.state || detail.status} />
        <Summary icon={UserRound} label="Current rigger" value={detail.riggerName} />
        <Summary icon={CalendarDays} label="Plan date" value={dateOnly(detail.planDate)} />
        <Summary icon={CalendarDays} label="Created" value={dateTime(detail.createdDateTime)} />
        <Summary
          icon={ImageIcon}
          label="Images"
          value={
            detail.imageTotal === null || detail.imageTotal === undefined
              ? null
              : String(detail.imageTotal)
          }
        />
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <main className="space-y-4">
          <DetailSection
            title="General information"
            description="Assignment identity and operational classification."
          >
            <DefinitionGrid
              items={[
                ["Assignment ID", detail.assignmentId],
                ["Description", detail.description],
                ["Category", detail.category],
                ["State", detail.state],
                ["Status", detail.status],
                ["Partner", detail.company],
              ]}
            />
          </DetailSection>
          <DetailSection
            title="Tower Specification"
            description="Operational Tower values stored in this Assignment's snapshot."
          >
            {towerSpecificationStatus === "not_submitted" ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <h3 className="text-sm font-semibold text-slate-950">
                  Full Tower specification has not been submitted for this Assignment.
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Complete the Full Tower form from the mobile application to populate Tower Type,
                  Tower Height, Antenna, RRU, Sector, Route Distance, and Justification information.
                </p>
                {showAdministratorDiagnostic ? (
                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    <p>Source: Assignment snapshot</p>
                    <p>Source record: No matching Full Tower submission</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <DefinitionGrid
                  items={[
                    ["Tower Type", snapshotDisplay(detail.towerType)],
                    ["Tower Height", snapshotDisplay(detail.towerHeight)],
                    ["Total Antenna", snapshotDisplay(detail.totalAntenna)],
                    ["Total RRU", snapshotDisplay(detail.totalRru)],
                    ["Single Sector", snapshotDisplay(detail.singleSector)],
                    ["Multi Sector", snapshotDisplay(detail.multiSector)],
                    ["Route Distance", snapshotDisplay(detail.routeDistance)],
                    ["Justifikasi", snapshotDisplay(detail.justification)],
                  ]}
                />
                {showAdministratorDiagnostic ? (
                  <p className="mt-3 text-xs text-slate-500">Source: Assignment snapshot</p>
                ) : null}
              </>
            )}
          </DetailSection>
          <DetailSection
            title="Site and location"
            description="Confirmed tower and geographic information."
          >
            <DefinitionGrid
              items={[
                ["Tower ID", detail.towerId],
                ["Site name", detail.siteName],
                ["Cluster", detail.clusterName],
                ["Region", detail.region],
                ["Sub-region", detail.subRegion],
                ["Province", detail.province],
                ["Kabupaten", detail.kabupaten],
                ["Kecamatan", detail.kecamatan],
                ["Site type", detail.siteType],
                ["BTS type", detail.btsType],
                ["Antenna system", detail.antennaSystem],
                ["Antenna type", detail.antennaType],
              ]}
            />
          </DetailSection>
          <DetailSection
            title="Network Configuration"
            description="Operational values stored in this Assignment's Tower snapshot."
          >
            <div className="grid gap-3 lg:grid-cols-3">
              {networkSections.map((group) => (
                <section
                  key={group.title}
                  aria-label={group.title}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <h3 className="text-sm font-semibold text-slate-950">{group.title}</h3>
                  <dl className="mt-3 divide-y divide-slate-200">
                    {group.items.map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-4 py-2 text-sm">
                        <dt className="text-slate-600">{item.label}</dt>
                        <dd className="font-medium text-slate-950">{networkDisplay(item.value)}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          </DetailSection>
          {detail.assignmentId ? (
            <AssignmentWorkExecution
              assignmentId={detail.assignmentId}
              checklist={detail.workChecklist}
              report={detail.workReport}
              canEdit={canEditWorkExecution}
              readOnly={photoReadOnly}
            />
          ) : null}
          {detail.assignmentId ? (
            <AssignmentPhotoEvidence assignmentId={detail.assignmentId} readOnly={photoReadOnly} />
          ) : null}
          {detail.assignmentId ? (
            <AssignmentDiscussion assignmentId={detail.assignmentId} readOnly={photoReadOnly} />
          ) : null}
          <DetailSection
            title="Activity"
            description="Lifecycle and operational history from Assignment, audit, Cell, Image, and Report sources."
          >
            {/* Legacy placement contract: <AssignmentTimeline events={timeline} /> */}
            <AssignmentTimeline events={activityEvents} unavailableSources={activityUnavailableSources} legacyGap={activityEvents.some((event) => event.inferred)} auditCenterHref={auditCenterHref} />
          </DetailSection>
          <DetailSection
            title="Report"
            description="Report information stored on the Assignment record."
          >
            {reportUrl ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="rounded-xl bg-white p-2 text-indigo-700 shadow-sm">
                    <FileText aria-hidden="true" className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {detail.reportName || "Assignment report"}
                    </p>
                    <p className="text-xs text-slate-500">External report</p>
                  </div>
                </div>
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Open report
                  <ExternalLink aria-hidden="true" className="size-4" />
                </a>
              </div>
            ) : (
              <InlineEmpty
                icon={FileText}
                title="No report available"
                description="This Assignment does not contain a report link."
              />
            )}
          </DetailSection>
        </main>

        <aside aria-label="Assignment overview" className="space-y-4 xl:sticky xl:top-24">
          <AssignmentSlaPanel sla={sla} />
          <SidebarCard title="Operational status">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-600">Current state</span>
              <AssignmentStatusBadge status={detail.state || detail.status} />
            </div>
            <DefinitionList
              items={[
                ["FTP check", detail.ftpCheck],
                ["Completed", detail.completed],
                ["Image total", detail.imageTotal],
                ["Plan date", dateOnly(detail.planDate)],
                ["Revisit count", detail.revisitCount],
                ["Latest revisit", dateTime(detail.lastRevisitAt)],
              ]}
            />
          </SidebarCard>
          <SidebarCard title="People">
            <Person
              icon={UserRound}
              role="Rigger"
              name={detail.riggerName}
              email={detail.riggerEmail}
            />
            <Person icon={UsersRound} role="RNO" name={detail.rnoName} email={detail.rnoEmail} />
            <Person
              icon={UsersRound}
              role="Coordinator"
              name={detail.coordinatorName}
              email={detail.coordinatorEmail}
            />
            <Person
              icon={UsersRound}
              role="Operator"
              name={detail.operatorName}
              email={detail.operatorEmail}
            />
          </SidebarCard>
          <SidebarCard title="Key dates">
            <DefinitionList
              items={[
                ["Created", dateTime(detail.createdDateTime)],
                ["Accepted", dateTime(detail.acceptedDateTime)],
                ["Checked in", dateTime(detail.checkinDateTime)],
                ["Completed", dateTime(detail.completedDateTime)],
                ["Closed", dateTime(detail.closedDateTime)],
              ]}
            />
          </SidebarCard>
          <SidebarCard title="Quick actions">
            <div className="space-y-2 print:hidden">
              <AssignmentWorkflowActions row={row} towerId={detail.towerId} />
              <AssignmentRevisitDialog row={row} />
              <AssignmentReassignRiggerDialog
                row={row}
                assignmentKey={detail.assignmentKey}
                assignmentId={detail.assignmentId!}
              />
              {reportUrl ? (
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <ExternalLink aria-hidden="true" className="size-4" />
                  Open report
                </a>
              ) : null}
            </div>
          </SidebarCard>
        </aside>
      </div>
    </div>
  );
}

function MetaBadge({ label, value }: { label: string; value: string | null }) {
  if (!value || value === missing) return null;
  return (
    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
      <span className="text-slate-400">{label}:</span> {value}
    </span>
  );
}
function Summary({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: string | null;
}) {
  return (
    <article className={`${surface} flex items-center gap-3 p-4`}>
      <span className="rounded-xl bg-indigo-50 p-2 text-indigo-700">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 truncate text-sm font-semibold text-slate-950" title={value || missing}>
          {value || missing}
        </p>
      </div>
    </article>
  );
}
function DetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${surface} overflow-hidden`}>
      <header className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
function DefinitionGrid({ items }: { items: ReadonlyArray<readonly [string, string | null]> }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([label, value]) => (
        <InfoField key={label} label={label} value={value} />
      ))}
    </dl>
  );
}
function InfoField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className={label === "Description" ? "sm:col-span-2 lg:col-span-3" : ""}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-900">{value || missing}</dd>
    </div>
  );
}
function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={`${surface} p-4`}>
      <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}
function DefinitionList({ items }: { items: ReadonlyArray<readonly [string, unknown]> }) {
  return (
    <dl className="divide-y divide-slate-100">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="flex items-start justify-between gap-4 py-2.5 text-sm first:pt-0 last:pb-0"
        >
          <dt className="text-slate-500">{label}</dt>
          <dd className="max-w-[60%] break-words text-right font-medium text-slate-800">
            {value === null || value === undefined || value === "" ? missing : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
function Person({
  icon: Icon,
  role,
  name,
  email,
}: {
  icon: typeof UserRound;
  role: string;
  name: string | null;
  email: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="rounded-full bg-slate-100 p-2 text-slate-600">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{role}</p>
        <p className="truncate text-sm font-semibold text-slate-900">{name || missing}</p>
        {email ? <p className="truncate text-xs text-slate-500">{email}</p> : null}
      </div>
    </div>
  );
}
function InlineEmpty({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-7 text-center">
      <Icon aria-hidden="true" className="mx-auto size-6 text-slate-400" />
      <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
