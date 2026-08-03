import type { AssignmentSlaState } from "./assignment-sla-contract";
import type { RawAssignmentRecord } from "./assignment-types";
import * as runtime from "./assignment-map-contract.mjs";

export type AssignmentMapPreset = "today" | "week" | "month" | "last30" | "custom";
export type AssignmentCoordinateState = "valid" | "missing" | "invalid" | "possibly-reversed";
export interface AssignmentCoordinateResult {
  state: AssignmentCoordinateState;
  latitude: number | null;
  longitude: number | null;
  reason: string | null;
}
export interface AssignmentMapFilters {
  preset: AssignmentMapPreset;
  startDate: string;
  endDate: string;
  coordinator: string;
  rigger: string;
  category: string;
  region: string;
  status: string;
  slaState: AssignmentSlaState | "";
  keyword: string;
  error: string | null;
}
export type AssignmentMapSearchParams = Record<string, string | string[] | undefined>;
export interface AssignmentMapMarker {
  key: string;
  assignmentId: string;
  towerId: string;
  siteName: string;
  clusterName: string;
  region: string;
  subRegion: string;
  category: string;
  status: string;
  slaState: AssignmentSlaState;
  riggerName: string;
  coordinatorName: string;
  createdDateTime: string;
  latitude: number;
  longitude: number;
}
export interface AssignmentMapMissingItem {
  key: string;
  assignmentId: string;
  towerId: string;
  state: Exclude<AssignmentCoordinateState, "valid">;
  reason: string;
}
export interface AssignmentMapData {
  markers: AssignmentMapMarker[];
  missing: AssignmentMapMissingItem[];
  coordinateCounts: Record<AssignmentCoordinateState, number>;
  exceededLimit: boolean;
  options: {
    coordinators: string[];
    riggers: string[];
    categories: string[];
    regions: string[];
  };
}
export const ASSIGNMENT_MAP_MAX_RECORDS = runtime.ASSIGNMENT_MAP_MAX_RECORDS as number;
export const ASSIGNMENT_MAP_MAX_RANGE_DAYS = runtime.ASSIGNMENT_MAP_MAX_RANGE_DAYS as number;
export const ASSIGNMENT_MAP_DEFAULT_CENTER = runtime.ASSIGNMENT_MAP_DEFAULT_CENTER as readonly [number, number];
export const ASSIGNMENT_MAP_DEFAULT_ZOOM = runtime.ASSIGNMENT_MAP_DEFAULT_ZOOM as number;
export const ASSIGNMENT_MAP_SLA_STATES = runtime.ASSIGNMENT_MAP_SLA_STATES as readonly AssignmentSlaState[];
export const normalizeAssignmentCoordinates = runtime.normalizeAssignmentCoordinates as (
  record: RawAssignmentRecord,
) => AssignmentCoordinateResult;
export const parseAssignmentMapParams = runtime.parseAssignmentMapParams as (
  input?: AssignmentMapSearchParams, now?: Date,
) => AssignmentMapFilters;
export const matchesAssignmentMapFilters = runtime.matchesAssignmentMapFilters as (
  record: RawAssignmentRecord,
  sla: { state: AssignmentSlaState },
  filters: AssignmentMapFilters,
) => boolean;
