import {
  ASSIGNMENT_MAP_MAX_RECORDS,
  matchesAssignmentMapFilters,
  normalizeAssignmentCoordinates,
  type AssignmentCoordinateState,
  type AssignmentMapData,
  type AssignmentMapFilters,
  type AssignmentMapMarker,
  type AssignmentMapMissingItem,
} from "@/features/assignment/assignment-map-contract";
import { evaluateAssignmentSla } from "@/features/assignment/assignment-sla-contract";
import type { RawAssignmentRecord } from "@/features/assignment/assignment-types";
import type { AssignmentMapRepository } from "./assignment-map-repository";

const text = (value: unknown) => String(value ?? "").trim();
const values = (records: RawAssignmentRecord[], field: string) =>
  [...new Set(records.map((record) => text(record[field])).filter(Boolean))].sort((a, b) => a.localeCompare(b));

export class AssignmentMapService {
  constructor(
    private readonly repository: AssignmentMapRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async read(filters: AssignmentMapFilters): Promise<AssignmentMapData> {
    const result = await this.repository.readCreatedRange(
      filters.startDate, filters.endDate, ASSIGNMENT_MAP_MAX_RECORDS,
    );
    const now = this.now();
    const filtered = result.records.flatMap(({ key, value }) => {
      const sla = evaluateAssignmentSla(value, now);
      return matchesAssignmentMapFilters(value, sla, filters) ? [{ key, value, sla }] : [];
    });
    const coordinateCounts: Record<AssignmentCoordinateState, number> = {
      valid: 0, missing: 0, invalid: 0, "possibly-reversed": 0,
    };
    const markers: AssignmentMapMarker[] = [];
    const missing: AssignmentMapMissingItem[] = [];
    for (const { key, value, sla } of filtered) {
      const coordinate = normalizeAssignmentCoordinates(value);
      coordinateCounts[coordinate.state] += 1;
      if (coordinate.state === "valid" && coordinate.latitude !== null && coordinate.longitude !== null) {
        markers.push({
          key,
          assignmentId: text(value.assignment_id) || key,
          towerId: text(value.tower_id),
          siteName: text(value.sitename),
          clusterName: text(value.new_cluster_name),
          region: text(value.region),
          subRegion: text(value.sub_region),
          category: text(value.assignment_category),
          status: text(value.assignment_state),
          slaState: sla.state,
          riggerName: text(value.rigger_name),
          coordinatorName: text(value.coordinator_name),
          createdDateTime: text(value.created_datetime),
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
        });
      } else if (coordinate.state !== "valid") {
        missing.push({
          key,
          assignmentId: text(value.assignment_id) || key,
          towerId: text(value.tower_id),
          state: coordinate.state,
          reason: coordinate.reason ?? "Coordinates are unavailable.",
        });
      }
    }
    const records = filtered.map(({ value }) => value);
    return {
      markers, missing, coordinateCounts, exceededLimit: result.exceededLimit,
      options: {
        coordinators: values(records, "coordinator_name"),
        riggers: values(records, "rigger_name"),
        categories: values(records, "assignment_category"),
        regions: values(records, "region"),
      },
    };
  }
}
