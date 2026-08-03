import type { LegacyAssignmentScalar, RawAssignmentRecord } from "./assignment-types";
import { towerSpecificationStatus } from "./assignment-tower-snapshot-contract.mjs";
import {
  normalizeAssignmentChecklist,
  normalizeAssignmentWorkReport,
  type AssignmentChecklist,
  type AssignmentWorkReport,
} from "./assignment-execution-contract";

export interface AssignmentRevisitHistoryItem {
  key: string;
  action: string;
  at: string;
  byUid: string | null;
  byName: string;
  reason: string;
  previousStatus: string;
  newStatus: string;
  previousCompletedAt: string | null;
}
export interface AssignmentDetail {
  assignmentKey: string;
  assignmentId: string | null;
  description: string | null;
  category: string | null;
  state: string | null;
  status: string | null;
  company: string | null;
  region: string | null;
  subRegion: string | null;
  province: string | null;
  kabupaten: string | null;
  kecamatan: string | null;
  towerId: string | null;
  siteName: string | null;
  clusterName: string | null;
  siteType: string | null;
  btsType: string | null;
  antennaSystem: string | null;
  antennaType: string | null;
  towerType: LegacyAssignmentScalar;
  towerHeight: LegacyAssignmentScalar;
  totalAntenna: LegacyAssignmentScalar;
  totalRru: LegacyAssignmentScalar;
  singleSector: LegacyAssignmentScalar;
  multiSector: LegacyAssignmentScalar;
  routeDistance: LegacyAssignmentScalar;
  justification: LegacyAssignmentScalar;
  riggerName: string | null;
  riggerEmail: string | null;
  rnoName: string | null;
  rnoEmail: string | null;
  coordinatorName: string | null;
  coordinatorEmail: string | null;
  operatorName: string | null;
  operatorEmail: string | null;
  planDate: string | null;
  createdDateTime: string | null;
  acceptedDateTime: string | null;
  checkinDateTime: string | null;
  pausedDateTime: string | null;
  completedDateTime: string | null;
  completedByName: string | null;
  rejectedDateTime: string | null;
  closedDateTime: string | null;
  rejectedReason: string | null;
  reportName: string | null;
  reportUrl: string | null;
  imageTotal: LegacyAssignmentScalar;
  ftpCheck: LegacyAssignmentScalar;
  completed: LegacyAssignmentScalar;
  revisitCount: number;
  lastRevisitAt: string | null;
  lastRevisitBy: string | null;
  lastRevisitReason: string | null;
  revisitHistory: readonly AssignmentRevisitHistoryItem[];
  workChecklist: AssignmentChecklist;
  workReport: AssignmentWorkReport;
  network: ReadonlyArray<{ label: string; value: LegacyAssignmentScalar }>;
}

export type AssignmentTowerSpecificationStatus = "not_submitted" | "partial" | "available";

export function assignmentTowerSpecificationStatus(
  detail: Pick<
    AssignmentDetail,
    | "towerType"
    | "towerHeight"
    | "totalAntenna"
    | "totalRru"
    | "singleSector"
    | "multiSector"
    | "routeDistance"
    | "justification"
  >,
): AssignmentTowerSpecificationStatus {
  const values = [
    detail.towerType,
    detail.towerHeight,
    detail.totalAntenna,
    detail.totalRru,
    detail.singleSector,
    detail.multiSector,
    detail.routeDistance,
    detail.justification,
  ];
  return towerSpecificationStatus(values) as AssignmentTowerSpecificationStatus;
}

const text = (value: LegacyAssignmentScalar): string | null => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

export function mapRawAssignmentToDetail(
  assignmentKey: string,
  raw: RawAssignmentRecord,
): AssignmentDetail {
  return {
    assignmentKey,
    assignmentId: text(raw.assignment_id),
    description: text(raw.assignment_description),
    category: text(raw.assignment_category),
    state: text(raw.assignment_state),
    status: text(raw.assignment_status),
    company: text(raw.company),
    region: text(raw.region),
    subRegion: text(raw.sub_region),
    province: text(raw.province),
    kabupaten: text(raw.kabupaten),
    kecamatan: text(raw.kecamatan),
    towerId: text(raw.tower_id),
    siteName: text(raw.sitename),
    clusterName: text(raw.new_cluster_name),
    siteType: text(raw.site_type),
    btsType: text(raw.bts_type),
    antennaSystem: text(raw.antenna_system),
    antennaType: text(raw.antenna_type),
    towerType: raw.tower_type,
    towerHeight: raw.tower_height,
    totalAntenna: raw.total_antenna,
    totalRru: raw.total_rru,
    singleSector: raw.single_sector,
    multiSector: raw.multi_sector,
    routeDistance: raw.route_distance,
    justification: raw.justifikasi,
    riggerName: text(raw.rigger_name),
    riggerEmail: text(raw.rigger_email),
    rnoName: text(raw.rno_name),
    rnoEmail: text(raw.rno_email),
    coordinatorName: text(raw.coordinator_name),
    coordinatorEmail: text(raw.coordinator_email),
    operatorName: text(raw.operator_name),
    operatorEmail: text(raw.operator_email),
    planDate: text(raw.plan_date),
    createdDateTime: text(raw.created_datetime),
    acceptedDateTime: text(raw.accepted_datetime),
    checkinDateTime: text(raw.checkin_datetime),
    pausedDateTime: text(raw.paused_datetime),
    completedDateTime: text(raw.completed_datetime),
    completedByName: text(raw.completed_by_name),
    rejectedDateTime: text(raw.rejected_datetime),
    closedDateTime: text(raw.closed_datetime),
    rejectedReason: text(raw.rejected_reason),
    reportName: text(raw.report_name),
    reportUrl: text(raw.report_url),
    imageTotal: raw.image_total,
    ftpCheck: raw.ftp_check,
    completed: raw.completed,
    revisitCount: Math.max(0, Number.parseInt(String(raw.revisit_count ?? "0"), 10) || 0),
    lastRevisitAt: text(raw.last_revisit_at),
    lastRevisitBy: text(raw.last_revisit_by),
    lastRevisitReason: text(raw.last_revisit_reason),
    revisitHistory: Object.entries(raw.revisit_history ?? {})
      .map(([eventKey, event]) => ({
        key: eventKey,
        action: text(event.action) ?? "Assignment Revisited",
        at: text(event.at) ?? "",
        byUid: text(event.by_uid),
        byName: text(event.by_name) ?? "Unknown user",
        reason: text(event.reason) ?? "No reason recorded.",
        previousStatus: text(event.previous_status) ?? "Completed",
        newStatus: text(event.new_status) ?? "On Progress",
        previousCompletedAt: text(event.previous_completed_at),
      }))
      .sort((a, b) => a.at.localeCompare(b.at)),
    workChecklist: normalizeAssignmentChecklist(raw.work_checklist),
    workReport: normalizeAssignmentWorkReport(raw.work_report),
    network: [
      { label: "GSM 900", value: raw.g900 },
      { label: "GSM 1800", value: raw.g1800 },
      { label: "UMTS 900", value: raw.u900 },
      { label: "UMTS 2100", value: raw.u2100 },
      { label: "L700", value: raw.l700 },
      { label: "L850", value: raw.l850 },
      { label: "LTE 900", value: raw.l900 },
      { label: "LTE 1800", value: raw.l1800 },
      { label: "LTE 2100", value: raw.l2100 },
      { label: "L2300", value: raw.l2300 },
      { label: "L2600", value: raw.l2600 },
    ],
  };
}
