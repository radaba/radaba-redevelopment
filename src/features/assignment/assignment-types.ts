export type LegacyAssignmentScalar = string | number | boolean | null | undefined;

export interface RawAssignmentRevisitEvent {
  action?: LegacyAssignmentScalar;
  at?: LegacyAssignmentScalar;
  by_uid?: LegacyAssignmentScalar;
  by_name?: LegacyAssignmentScalar;
  reason?: LegacyAssignmentScalar;
  previous_status?: LegacyAssignmentScalar;
  new_status?: LegacyAssignmentScalar;
  previous_completed_at?: LegacyAssignmentScalar;
}

export type RawAssignmentRevisitHistory = Record<string, RawAssignmentRevisitEvent>;

export interface RawAssignmentChecklistItem {
  label?: LegacyAssignmentScalar;
  status?: LegacyAssignmentScalar;
  note?: LegacyAssignmentScalar;
  custom?: LegacyAssignmentScalar;
  updated_at?: LegacyAssignmentScalar;
  updated_by_uid?: LegacyAssignmentScalar;
  updated_by_name?: LegacyAssignmentScalar;
}
export interface RawAssignmentChecklist {
  revision?: LegacyAssignmentScalar;
  initialized_at?: LegacyAssignmentScalar;
  initialized_by_uid?: LegacyAssignmentScalar;
  initialized_by_name?: LegacyAssignmentScalar;
  updated_at?: LegacyAssignmentScalar;
  updated_by_uid?: LegacyAssignmentScalar;
  updated_by_name?: LegacyAssignmentScalar;
  items?: Record<string, RawAssignmentChecklistItem>;
}
export interface RawAssignmentMaterial {
  name?: LegacyAssignmentScalar;
  quantity?: LegacyAssignmentScalar;
  unit?: LegacyAssignmentScalar;
  note?: LegacyAssignmentScalar;
}
export interface RawAssignmentWorkReport {
  revision?: LegacyAssignmentScalar;
  findings?: LegacyAssignmentScalar;
  actions_performed?: LegacyAssignmentScalar;
  technical_result?: LegacyAssignmentScalar;
  completion_notes?: LegacyAssignmentScalar;
  recommendations?: LegacyAssignmentScalar;
  materials?: Record<string, RawAssignmentMaterial>;
  updated_at?: LegacyAssignmentScalar;
  updated_by_uid?: LegacyAssignmentScalar;
  updated_by_name?: LegacyAssignmentScalar;
}
export interface RawAssignmentRecord {
  [field: string]:
    | LegacyAssignmentScalar
    | RawAssignmentRevisitHistory
    | RawAssignmentChecklist
    | RawAssignmentWorkReport;
  accepted_date?: LegacyAssignmentScalar;
  accepted_datetime?: LegacyAssignmentScalar;
  antenna_system?: LegacyAssignmentScalar;
  antenna_type?: LegacyAssignmentScalar;
  assignment_category?: LegacyAssignmentScalar;
  assignment_description?: LegacyAssignmentScalar;
  assignment_id?: LegacyAssignmentScalar;
  assignment_state?: LegacyAssignmentScalar;
  assignment_status?: LegacyAssignmentScalar;
  bts_type?: LegacyAssignmentScalar;
  checkin_date?: LegacyAssignmentScalar;
  checkin_datetime?: LegacyAssignmentScalar;
  closed_date?: LegacyAssignmentScalar;
  closed_datetime?: LegacyAssignmentScalar;
  company?: LegacyAssignmentScalar;
  completed?: LegacyAssignmentScalar;
  completed_date?: LegacyAssignmentScalar;
  completed_datetime?: LegacyAssignmentScalar;
  completed_by_uid?: LegacyAssignmentScalar;
  completed_by_name?: LegacyAssignmentScalar;
  coordinator_email?: LegacyAssignmentScalar;
  coordinator_name?: LegacyAssignmentScalar;
  created_date?: LegacyAssignmentScalar;
  created_datetime?: LegacyAssignmentScalar;
  ftp_check?: LegacyAssignmentScalar;
  g900?: LegacyAssignmentScalar;
  g1800?: LegacyAssignmentScalar;
  image_total?: LegacyAssignmentScalar;
  index_closed_date_assignment_status?: LegacyAssignmentScalar;
  index_closed_date_assignment_category?: LegacyAssignmentScalar;
  index_closed_date_company?: LegacyAssignmentScalar;
  index_closed_date_coordinator_name?: LegacyAssignmentScalar;
  index_closed_date_kabupaten?: LegacyAssignmentScalar;
  index_closed_date_kecamatan?: LegacyAssignmentScalar;
  index_closed_date_province?: LegacyAssignmentScalar;
  index_closed_date_region?: LegacyAssignmentScalar;
  index_closed_date_rigger_name?: LegacyAssignmentScalar;
  index_closed_date_rno_name?: LegacyAssignmentScalar;
  index_closed_date_sub_region?: LegacyAssignmentScalar;
  index_closed_date_tower_id?: LegacyAssignmentScalar;
  index_created_date_assignment_status?: LegacyAssignmentScalar;
  index_created_date_assignment_category?: LegacyAssignmentScalar;
  index_created_date_company?: LegacyAssignmentScalar;
  index_created_date_coordinator_name?: LegacyAssignmentScalar;
  index_created_date_kabupaten?: LegacyAssignmentScalar;
  index_created_date_kecamatan?: LegacyAssignmentScalar;
  index_created_date_province?: LegacyAssignmentScalar;
  index_created_date_region?: LegacyAssignmentScalar;
  index_created_date_rigger_name?: LegacyAssignmentScalar;
  index_created_date_rno_name?: LegacyAssignmentScalar;
  index_created_date_sub_region?: LegacyAssignmentScalar;
  index_created_date_tower_id?: LegacyAssignmentScalar;
  kabupaten?: LegacyAssignmentScalar;
  kecamatan?: LegacyAssignmentScalar;
  l700?: LegacyAssignmentScalar;
  l850?: LegacyAssignmentScalar;
  l900?: LegacyAssignmentScalar;
  l1800?: LegacyAssignmentScalar;
  l2100?: LegacyAssignmentScalar;
  l2300?: LegacyAssignmentScalar;
  l2600?: LegacyAssignmentScalar;
  latitude?: LegacyAssignmentScalar;
  longitude?: LegacyAssignmentScalar;
  new_cluster_name?: LegacyAssignmentScalar;
  operator_email?: LegacyAssignmentScalar;
  operator_name?: LegacyAssignmentScalar;
  optimasi?: LegacyAssignmentScalar;
  paused_date?: LegacyAssignmentScalar;
  paused_datetime?: LegacyAssignmentScalar;
  plan_date?: LegacyAssignmentScalar;
  province?: LegacyAssignmentScalar;
  region?: LegacyAssignmentScalar;
  rejected_date?: LegacyAssignmentScalar;
  rejected_datetime?: LegacyAssignmentScalar;
  rejected_reason?: LegacyAssignmentScalar;
  revisit_count?: LegacyAssignmentScalar;
  last_revisit_at?: LegacyAssignmentScalar;
  last_revisit_by?: LegacyAssignmentScalar;
  last_revisit_reason?: LegacyAssignmentScalar;
  revisit_history?: RawAssignmentRevisitHistory;
  work_checklist?: RawAssignmentChecklist;
  work_report?: RawAssignmentWorkReport;
  report_name?: LegacyAssignmentScalar;
  report_url?: LegacyAssignmentScalar;
  rigger_email?: LegacyAssignmentScalar;
  rigger_latitude?: LegacyAssignmentScalar;
  rigger_longitude?: LegacyAssignmentScalar;
  rigger_name?: LegacyAssignmentScalar;
  rno_email?: LegacyAssignmentScalar;
  rno_name?: LegacyAssignmentScalar;
  site_type?: LegacyAssignmentScalar;
  sitename?: LegacyAssignmentScalar;
  sub_region?: LegacyAssignmentScalar;
  timestamp?: LegacyAssignmentScalar;
  tower_id?: LegacyAssignmentScalar;
  tower_type?: LegacyAssignmentScalar;
  tower_height?: LegacyAssignmentScalar;
  total_antenna?: LegacyAssignmentScalar;
  total_rru?: LegacyAssignmentScalar;
  single_sector?: LegacyAssignmentScalar;
  multi_sector?: LegacyAssignmentScalar;
  route_distance?: LegacyAssignmentScalar;
  justifikasi?: LegacyAssignmentScalar;
  tower_latitude?: LegacyAssignmentScalar;
  tower_longitude?: LegacyAssignmentScalar;
  u900?: LegacyAssignmentScalar;
  u2100?: LegacyAssignmentScalar;
}

export interface RawAssignmentSnapshotEntry {
  key: string;
  value: RawAssignmentRecord;
}

export interface AssignmentListItem {
  key: string;
  assignment_id: string | null;
  tower_id: string | null;
  assignment_category: string | null;
  rno_name: string | null;
  coordinator_name: string | null;
  region: string | null;
  sub_region: string | null;
  company: string | null;
  rigger_name: string | null;
  rigger_email: string | null;
  assignment_status: string | null;
  assignment_state: string | null;
  created_date: string | null;
  created_datetime: string | null;
  closed_date: string | null;
  closed_datetime: string | null;
  checkin_datetime: string | null;
  completed?: LegacyAssignmentScalar;
  completed_datetime: string | null;
  image_total: number | string | null;
  sla?: import("./assignment-sla-contract").AssignmentSlaEvaluation;
}
