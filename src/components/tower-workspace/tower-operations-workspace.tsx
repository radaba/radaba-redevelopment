"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronRight,
  Download,
  ImageOff,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import { PageHeader } from "@/components/application-shell/page-header";
import { TowerDetailActions } from "@/components/tower/tower-detail-actions";
import { TowerEditDialog } from "@/components/tower/tower-edit-dialog";
import { TowerDependencyViewer } from "@/components/tower/tower-dependency-viewer";
import { TowerAuditTimeline } from "@/components/tower/tower-audit-timeline";
import { mapTower } from "@/features/tower/tower-mapper";
import { towerCoordinates } from "@/features/tower-workspace/tower-workspace-contract";
import type {
  CellRecord,
  NormalizedImageReference,
} from "@/features/cells-images/cells-images-types";
import type { TowerWorkspaceRecord } from "@/features/tower-workspace/tower-workspace-types";
import type { AorReportRecord } from "@/features/report/aor-report-types";
import { RelatedReports } from "@/components/report/related-reports";
const text = (value: unknown) => String(value ?? "").trim();
const show = (value: unknown) => text(value) || "Not available";
const countImages = (workspace: TowerWorkspaceRecord, cell: CellRecord) =>
  workspace.cellImages.filter((image) => image.cellKey === cell.databaseKey).length;
const closed = (cell: CellRecord) => Boolean(text(cell.closed_datetime ?? cell.closed_date));
const csv = (value: unknown) => {
  let raw = text(value);
  if (/^[=+\-@]/.test(raw)) raw = `'${raw}`;
  return `"${raw.replaceAll('"', '""')}"`;
};
export function TowerOperationsWorkspace({
  towerKey,
  workspace,
  reports,
  canEdit = false,
  canViewDependencies = false,
}: {
  towerKey: string;
  workspace: TowerWorkspaceRecord;
  reports: AorReportRecord[];
  canEdit?: boolean;
  canViewDependencies?: boolean;
}) {
  const router = useRouter(),
    [pending, startTransition] = useTransition();
  const [imageFilters, setImageFilters] = useState({
    source: "",
    sector: "",
    band: "",
    category: "",
    broken: false,
  });
  const tower = workspace.tower,
    assignment = workspace.assignment,
    coordinates = towerCoordinates(tower),
    editableTower = mapTower(towerKey, tower);
  const allImages = useMemo(() => [...workspace.towerImages, ...workspace.cellImages], [workspace]);
  const images = useMemo(
    () =>
      allImages.filter(
        (image) =>
          (!imageFilters.source || image.sourceRecordType === imageFilters.source) &&
          (!imageFilters.sector || text(image.sector) === imageFilters.sector) &&
          (!imageFilters.band || text(image.band) === imageFilters.band) &&
          (!imageFilters.category || image.category === imageFilters.category) &&
          (!imageFilters.broken || image.dataQuality !== "complete"),
      ),
    [allImages, imageFilters],
  );
  const sectors = new Set(workspace.cells.map((cell) => text(cell.sector)).filter(Boolean));
  const bands = new Set(workspace.cells.map((cell) => text(cell.band)).filter(Boolean));
  const exportMetadata = () => {
    const rows = [
      [
        "record_type",
        "record_key",
        "business_id",
        "sector",
        "band",
        "category",
        "filename",
        "quality",
      ],
      ["tower", tower.databaseKey, tower.tower_id, "", "", "", "", ""],
      ...workspace.cells.map((cell) => [
        "cell",
        cell.databaseKey,
        cell.rcell_id,
        cell.sector,
        cell.band,
        "",
        "",
        "",
      ]),
      ...allImages.map((image) => [
        "image",
        image.id,
        image.rcellId ?? image.towerId,
        image.sector,
        image.band,
        image.category,
        image.fileName,
        image.dataQuality,
      ]),
      ...workspace.warnings.map((warning) => [
        "warning",
        warning.recordKey,
        "",
        "",
        "",
        warning.code,
        warning.message,
        warning.severity,
      ]),
    ];
    const blob = new Blob(["\uFEFF", rows.map((row) => row.map(csv).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `tower-${text(tower.tower_id) || "metadata"}.csv`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };
  const subtitle = [show(tower.sitename), show(tower.region), assignment?.assignment_id]
    .filter((value) => value && value !== "Not available")
    .join(" · ");
  return (
    <div className="space-y-5" aria-busy={pending}>
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1 text-sm text-slate-500"
      >
        <Link className="focus-visible:ring-2" href="/home/assignment">
          Home
        </Link>
        <ChevronRight className="size-4" aria-hidden="true" />
        <Link className="focus-visible:ring-2" href="/home/towers">
          Towers
        </Link>
        <ChevronRight className="size-4" aria-hidden="true" />
        <span aria-current="page">{show(tower.tower_id)}</span>
      </nav>
      <PageHeader
        title={`Tower ${show(tower.tower_id)}`}
        description={subtitle}
        actions={
          <div className="flex flex-wrap gap-2">
            {canEdit ? <TowerEditDialog tower={editableTower} /> : null}
            {canViewDependencies ? <TowerDependencyViewer tower={editableTower} /> : null}
            <TowerAuditTimeline tower={editableTower} />
            <Link
              className="action-button"
              href={`/home/towers/map?q=${encodeURIComponent(text(tower.tower_id))}`}
            >
              View on Map
            </Link>
            <button
              className="action-button"
              onClick={() => startTransition(() => router.refresh())}
            >
              <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} aria-hidden="true" />
              Refresh
            </button>
            {assignment ? (
              <Link
                className="action-button"
                href={`/home/assignment/${encodeURIComponent(assignment.key)}`}
              >
                Open Assignment
              </Link>
            ) : null}
            <Link
              className="action-button"
              href={`/home/cells?${new URLSearchParams({ tower: text(tower.tower_id) })}`}
            >
              View All Cells
            </Link>
            <button className="action-button" onClick={exportMetadata}>
              <Download className="size-4" aria-hidden="true" />
              Export Metadata
            </button>
          </div>
        }
      />
      {text(tower.rigger_name) || assignment?.rigger_name ? (
        <p className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          <Smartphone className="size-4" aria-hidden="true" />
          Rigger Mobile Submission
        </p>
      ) : null}
      {workspace.warnings.some((warning) => warning.severity === "error") ? (
        <p
          role="alert"
          className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900"
        >
          <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
          This legacy record has critical missing identity data. Available sections remain
          read-only.
        </p>
      ) : null}
      <section aria-label="Tower summary" className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[
          ["Total Cells", workspace.cells.length],
          ["Total Sectors", sectors.size],
          ["Total Bands", bands.size],
          ["Tower Images", workspace.towerImages.length],
          ["Cell Images", workspace.cellImages.length],
          [
            "Closed / Open",
            `${workspace.cells.filter(closed).length} / ${workspace.cells.filter((cell) => !closed(cell)).length}`,
          ],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </article>
        ))}
      </section>
      <nav
        aria-label="Workspace sections"
        className="sticky top-16 z-10 flex gap-2 overflow-x-auto rounded-xl border bg-white p-2 shadow-sm"
      >
        {[
          ["overview", "Overview"],
          ["sectors", "Sectors & Cells"],
          ["images", "Images"],
          ["people", "People"],
          ["timeline", "Timeline"],
          ["reports", "Reports"],
          ["quality", "Data Quality"],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-indigo-700 focus-visible:ring-2"
          >
            {label}
          </a>
        ))}
      </nav>
      <section id="overview" className="scroll-mt-32 space-y-4">
        <Heading title="Overview" />
        <div className="grid gap-4 xl:grid-cols-2">
          <Info
            title="Identity"
            rows={[
              ["Tower ID", tower.tower_id],
              ["Site ID", tower.site_id],
              ["Site name", tower.sitename],
              ["Assignment ID", assignment?.assignment_id],
              ["Source type", "Tower / Visit"],
              ["Database key", tower.databaseKey],
            ]}
          />
          <Info
            title="Location"
            rows={[
              ["Province", tower.province],
              ["Kabupaten", tower.kabupaten],
              ["Kecamatan", tower.kecamatan],
              ["Region", tower.region],
              ["Sub region", tower.sub_region],
              ["Latitude", tower.tower_latitude ?? tower.latitude],
              ["Longitude", tower.tower_longitude ?? tower.longitude],
            ]}
          />
          <Info
            title="Submission"
            rows={[
              ["Rigger", tower.rigger_name ?? assignment?.rigger_name],
              ["Rigger email", tower.rigger_email ?? assignment?.rigger_email],
              ["RNO", tower.rno_name ?? assignment?.rno_name],
              ["Submitted", tower.submitted_at ?? tower.created_datetime],
              ["Updated", tower.updated_at ?? tower.updated_datetime],
            ]}
          />
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <h3 className="font-semibold">Coordinates</h3>
          {coordinates ? (
            <div className="mt-3">
              <p className="mb-3 text-sm">
                {coordinates.latitude}, {coordinates.longitude}
              </p>
              <TowerDetailActions towerId={show(tower.tower_id)} coordinates={coordinates} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              Coordinates are missing, malformed, or outside valid ranges.
            </p>
          )}
        </div>
      </section>
      <section id="sectors" className="scroll-mt-32 space-y-4">
        <Heading title="Sectors & Cells" />
        {workspace.cells.length ? (
          <>
            <SectorTable workspace={workspace} />
            <SectorCards workspace={workspace} />
          </>
        ) : (
          <Empty
            title="Cells missing"
            text="No associated Cell records were found in the bounded Tower and newest-Assignment queries."
          />
        )}
      </section>
      <section id="images" className="scroll-mt-32 space-y-4">
        <Heading title="Images" />
        <div className="grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Select
            label="Source"
            value={imageFilters.source}
            set={(source) => setImageFilters({ ...imageFilters, source })}
            values={[
              ["", "All Images"],
              ["tower", "Tower Images"],
              ["cell", "Cell Images"],
            ]}
          />
          <Select
            label="Sector"
            value={imageFilters.sector}
            set={(sector) => setImageFilters({ ...imageFilters, sector })}
            values={[
              ["", "All sectors"],
              ...[...sectors].sort().map((x) => [x, x] as [string, string]),
            ]}
          />
          <Select
            label="Band"
            value={imageFilters.band}
            set={(band) => setImageFilters({ ...imageFilters, band })}
            values={[
              ["", "All bands"],
              ...[...bands].sort().map((x) => [x, x] as [string, string]),
            ]}
          />
          <Select
            label="Category"
            value={imageFilters.category}
            set={(category) => setImageFilters({ ...imageFilters, category })}
            values={[
              ["", "All categories"],
              ...[...new Set(allImages.map((x) => x.category))]
                .sort()
                .map((x) => [x, x] as [string, string]),
            ]}
          />
          <label className="inline-flex min-h-11 items-center gap-2 pt-5 text-sm font-medium">
            <input
              type="checkbox"
              checked={imageFilters.broken}
              onChange={(e) => setImageFilters({ ...imageFilters, broken: e.target.checked })}
            />
            Broken or incomplete
          </label>
        </div>
        {images.length ? (
          <ImageGroups images={images} />
        ) : (
          <Empty
            title={allImages.length ? "No matching images" : "Images missing"}
            text={
              allImages.length
                ? "No images match the local filters."
                : "No embedded image references were found in this bounded workspace."
            }
          />
        )}
      </section>
      <section id="people" className="scroll-mt-32 space-y-4">
        <Heading title="People" />
        {workspace.people.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workspace.people.map((person, index) => (
              <article
                className="rounded-2xl border bg-white p-5"
                key={`${person.role}-${person.email}-${index}`}
              >
                <p className="text-xs font-semibold uppercase text-indigo-700">{person.role}</p>
                <h3 className="mt-2 font-semibold">{show(person.name)}</h3>
                <p className="mt-1 break-words text-sm text-slate-600">{show(person.email)}</p>
                <p className="mt-3 text-xs text-slate-500">Sources: {person.sources.join(", ")}</p>
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="People unavailable"
            text="No supported operational identities are stored."
          />
        )}
      </section>
      <section id="timeline" className="scroll-mt-32 space-y-4">
        <Heading title="Recorded Timestamps" />
        {workspace.timeline.length ? (
          <ol className="rounded-2xl border bg-white p-5">
            {workspace.timeline.map((event, index) => (
              <li
                className="flex gap-3 border-l border-indigo-200 pb-5 pl-4 last:pb-0"
                key={`${event.timestamp}-${event.label}-${index}`}
              >
                <span className="-ml-[1.31rem] mt-1.5 size-2 rounded-full bg-indigo-600" />
                <div>
                  <h3 className="text-sm font-semibold">{event.label}</h3>
                  <p className="text-sm text-slate-600">
                    {event.timestamp} · {event.source}
                    {event.actor ? ` · ${event.actor}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <Empty
            title="No recorded timestamps"
            text="The bounded records contain no supported operational timestamps."
          />
        )}
      </section>
      <section id="reports" className="scroll-mt-32 space-y-4">
        <Heading title="Historical AOR Reports" />
        <RelatedReports reports={reports} title="Reports for this Tower" />
      </section>
      <section id="quality" className="scroll-mt-32 space-y-4">
        <Heading title="Data Quality" />
        {workspace.warnings.length ? (
          <div className="space-y-3">
            {(["error", "warning", "info"] as const).map((severity) => {
              const warnings = workspace.warnings.filter((x) => x.severity === severity);
              return warnings.length ? (
                <section className="rounded-2xl border bg-white p-5" key={severity}>
                  <h3 className="font-semibold capitalize">
                    {severity} · {warnings.length}
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {warnings.map((warning, index) => (
                      <li
                        className="rounded-xl bg-slate-50 p-3 text-sm"
                        key={`${warning.code}-${index}`}
                      >
                        <strong>{warning.code.replaceAll("-", " ")}</strong>
                        <p className="mt-1 text-slate-600">{warning.message}</p>
                        {warning.recordType === "cell" && warning.recordKey ? (
                          <Link
                            className="row-link"
                            href={`/home/cells/${encodeURIComponent(warning.recordKey)}`}
                          >
                            View Cell
                          </Link>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null;
            })}
          </div>
        ) : (
          <Empty
            title="No data-quality warnings"
            text="No configured read-layer checks found an issue."
          />
        )}
      </section>
    </div>
  );
}
function Heading({ title }: { title: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-2 h-px bg-slate-200" />
    </div>
  );
}
function Info({ title, rows }: { title: string; rows: [string, unknown][] }) {
  return (
    <section className="rounded-2xl border bg-white p-5">
      <h3 className="font-semibold">{title}</h3>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
            <dd className="mt-1 break-words text-sm">{show(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
function CellValues({ cell, workspace }: { cell: CellRecord; workspace: TowerWorkspaceRecord }) {
  return (
    <>
      {[
        cell.sector,
        cell.band,
        cell.rcell_id,
        cell.rru_type,
        cell.antenna_type,
        `${show(cell.azimuth_before)} → ${show(cell.azimuth_after)}`,
        `${show(cell.mechanical_tilt_before)} → ${show(cell.mechanical_tilt_after)}`,
        `${show(cell.electrical_tilt_before)} → ${show(cell.electrical_tilt_after)}`,
        countImages(workspace, cell),
        cell.closed_datetime ?? cell.closed_date,
      ].map((value, index) => (
        <td className="max-w-44 break-words px-3 py-3" key={index}>
          {show(value)}
        </td>
      ))}
    </>
  );
}
function SectorTable({ workspace }: { workspace: TowerWorkspaceRecord }) {
  return (
    <div className="hidden max-h-[65vh] overflow-auto rounded-2xl border bg-white lg:block">
      <table className="w-full min-w-[1250px] text-left text-sm">
        <thead className="sticky top-0 bg-slate-50">
          <tr>
            {[
              "Sector",
              "Band",
              "RCell ID",
              "RRU Type",
              "Antenna Type",
              "Azimuth",
              "Mechanical Tilt",
              "Electrical Tilt",
              "Images",
              "Closed",
              "Action",
            ].map((x) => (
              <th className="border-b px-3 py-3" key={x}>
                {x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {workspace.groupedSectors
            .flatMap((group) => group.cells)
            .map((cell) => (
              <tr key={cell.databaseKey}>
                <CellValues cell={cell} workspace={workspace} />
                <td className="px-3">
                  <Link
                    className="row-link"
                    href={`/home/cells/${encodeURIComponent(cell.databaseKey)}`}
                  >
                    View Cell
                  </Link>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
function SectorCards({ workspace }: { workspace: TowerWorkspaceRecord }) {
  return (
    <div className="grid gap-4 lg:hidden">
      {workspace.groupedSectors.map((group) => (
        <section className="rounded-2xl border bg-white p-4" key={group.sector}>
          <h3 className="font-semibold">Sector {group.sector}</h3>
          <div className="mt-3 space-y-3">
            {group.cells.map((cell) => (
              <article className="rounded-xl border p-3" key={cell.databaseKey}>
                <p className="text-xs font-semibold uppercase text-indigo-700">{show(cell.band)}</p>
                <h4 className="mt-1 break-words font-semibold">{show(cell.rcell_id)}</h4>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  {(
                    [
                      ["RRU", `${show(cell.rru_type)} · ${show(cell.rru_serial_number)}`],
                      [
                        "Antenna",
                        `${show(cell.antenna_type)} · ${show(cell.antenna_serial_number)}`,
                      ],
                      ["Azimuth", `${show(cell.azimuth_before)} → ${show(cell.azimuth_after)}`],
                      [
                        "Mechanical tilt",
                        `${show(cell.mechanical_tilt_before)} → ${show(cell.mechanical_tilt_after)}`,
                      ],
                      [
                        "Electrical tilt",
                        `${show(cell.electrical_tilt_before)} → ${show(cell.electrical_tilt_after)}`,
                      ],
                      ["Images", countImages(workspace, cell)],
                      ["Closed", cell.closed_datetime ?? cell.closed_date],
                    ] as [string, unknown][]
                  ).map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs uppercase text-slate-500">{label}</dt>
                      <dd>{show(value)}</dd>
                    </div>
                  ))}
                </dl>
                <Link
                  className="row-link mt-3"
                  href={`/home/cells/${encodeURIComponent(cell.databaseKey)}`}
                >
                  View Cell
                </Link>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
function Select({
  label,
  value,
  set,
  values,
}: {
  label: string;
  value: string;
  set: (value: string) => void;
  values: [string, string][];
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <select className="field-control" value={value} onChange={(e) => set(e.target.value)}>
        {values.map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
function ImageGroups({ images }: { images: NormalizedImageReference[] }) {
  return (
    <div className="space-y-5">
      {(["tower", "cell"] as const).map((source) => {
        const rows = images.filter((image) => image.sourceRecordType === source);
        return rows.length ? (
          <section key={source}>
            <h3 className="mb-3 font-semibold">
              {source === "tower" ? "Tower Images" : "Cell Images"}
            </h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {rows.map((image) => (
                <article
                  key={image.id}
                  className="overflow-hidden rounded-2xl border bg-white"
                >
                  <div className="aspect-square bg-slate-100">
                    {image.url ? (
                      <img
                        src={image.url}
                        alt={`${image.category} for Tower workspace`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <ImageOff className="size-8 text-slate-400" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold">{image.category}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {source} · Sector {show(image.sector)} · {show(image.band)}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {show(image.riggerName)} · {show(image.fileName)}
                    </p>
                    {image.dataQuality !== "complete" ? (
                      <p className="mt-2 text-xs font-semibold text-amber-700">
                        {image.dataQuality}
                      </p>
                    ) : null}
                    {image.url ? (
                      <a href={image.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-10 items-center font-semibold text-indigo-700 focus-visible:ring-2">
                        Open original
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null;
      })}
    </div>
  );
}
function Empty({ title, text: description }: { title: string; text: string }) {
  return (
    <section className="rounded-2xl border border-dashed bg-white p-8 text-center">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </section>
  );
}
