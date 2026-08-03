import "server-only";

import type { DataSnapshot, Database, Query } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import { mapRawAssignmentToListItem } from "@/features/assignment/assignment-mapper";
import {
  buildAssignmentCompositeRange,
  buildAssignmentDateRange,
  getAssignmentQueryField,
  type AssignmentFilterCategory,
  type AssignmentListQueryInput,
} from "@/features/assignment/assignment-query-contract";
import {
  assignmentSearchField,
  buildTowerSearchRange,
} from "@/features/assignment/assignment-search-contract";
import { assertAssignmentQueryDate } from "@/features/assignment/assignment-date-contract";
import { evaluateAssignmentSla, matchesAssignmentSlaFilters } from "@/features/assignment/assignment-sla-contract";
import type {
  AssignmentListItem,
  RawAssignmentRecord,
  RawAssignmentSnapshotEntry,
} from "@/features/assignment/assignment-types";
import {
  ASSIGNMENT_RTDB_PATH,
  RELATED_ASSIGNMENT_DEFAULT_LIMIT,
  RELATED_ASSIGNMENT_MAXIMUM_LIMIT,
  RIGGER_ASSIGNMENT_DEFAULT_LIMIT,
  RIGGER_ASSIGNMENT_MAXIMUM_LIMIT,
  RIGGER_WORKLOAD_WINDOW_LIMIT,
  type AssignmentBoundedRows,
  type AssignmentRiggerIdentity,
  type AssignmentExportReadResult,
  type AssignmentReadRepository,
} from "./assignment-repository";

const FILTER_SOURCE_FIELDS: Record<AssignmentFilterCategory, string> = {
  status: "assignment_state",
  rigger_name: "rigger_name",
  region: "region",
  sub_region: "sub_region",
  company: "company",
};

function snapshotEntries(snapshot: DataSnapshot): RawAssignmentSnapshotEntry[] {
  const entries: RawAssignmentSnapshotEntry[] = [];
  snapshot.forEach((child) => {
    entries.push({ key: child.key ?? "", value: (child.val() ?? {}) as RawAssignmentRecord });
  });
  return entries;
}

function normalizeFilterValue(category: AssignmentFilterCategory, value: string): string {
  const trimmed = value.trim();
  if (category === "company") return trimmed.toUpperCase();
  return trimmed.toLowerCase().replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function limited(query: Query, maximum?: number): Query {
  return maximum ? query.limitToLast(maximum) : query;
}

function matchesDate(record: RawAssignmentRecord, input: AssignmentListQueryInput): boolean {
  const field = input.timeBasis === "onCreate" ? "created_date" : "closed_date";
  const value = record[field];
  return typeof value === "string" && value >= input.startDate && value <= input.endDate;
}

function matchesActiveFilter(
  record: RawAssignmentRecord,
  input: AssignmentListQueryInput,
): boolean {
  if (!input.filterCategory || !input.filterValues?.length) return true;
  const source = record[FILTER_SOURCE_FIELDS[input.filterCategory]];
  if (source === null || source === undefined) return false;
  const normalizedSource = normalizeFilterValue(input.filterCategory, String(source));
  return input.filterValues.some(
    (value) => normalizeFilterValue(input.filterCategory!, value) === normalizedSource,
  );
}

export class FirebaseAssignmentReadRepository implements AssignmentReadRepository {
  constructor(
    private readonly database: Database = firebaseAdminDatabase,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async findByKey(key: string): Promise<RawAssignmentSnapshotEntry | null> {
    const snapshot = await this.database.ref(ASSIGNMENT_RTDB_PATH).child(key).once("value");
    if (!snapshot.exists()) return null;
    return { key: snapshot.key ?? key, value: (snapshot.val() ?? {}) as RawAssignmentRecord };
  }
  async findByAssignmentId(assignmentId: string): Promise<RawAssignmentSnapshotEntry[]> {
    const snapshot = await this.database
      .ref(ASSIGNMENT_RTDB_PATH)
      .orderByChild(assignmentSearchField("assignmentId", "onCreate"))
      .equalTo(assignmentId.trim())
      .once("value");
    return snapshotEntries(snapshot);
  }

  async readBoundedRiggerWindow(maximumRows = RIGGER_WORKLOAD_WINDOW_LIMIT): Promise<AssignmentBoundedRows> {
    const limit = Math.min(RIGGER_WORKLOAD_WINDOW_LIMIT, Math.max(1, Math.trunc(maximumRows)));
    const rows = snapshotEntries(await this.database.ref(ASSIGNMENT_RTDB_PATH).orderByKey().limitToLast(limit + 1).once("value"));
    return { rows: rows.slice(-limit).map(({ key, value }) => mapRawAssignmentToListItem(key, value)), exceededLimit: rows.length > limit };
  }

  async findRecentByRiggerIdentity(identity: AssignmentRiggerIdentity, limit = RIGGER_ASSIGNMENT_DEFAULT_LIMIT): Promise<AssignmentBoundedRows> {
    const name = identity.name.trim(), email = identity.email.trim().toLowerCase();
    if (!name || !email) return { rows: [], exceededLimit: false };
    const boundedLimit = Math.min(RIGGER_ASSIGNMENT_MAXIMUM_LIMIT, Math.max(1, Math.trunc(limit)));
    const candidates = snapshotEntries(await this.database.ref(ASSIGNMENT_RTDB_PATH)
      .orderByChild("index_created_date_rigger_name").startAt(`${name}_`).endAt(`${name}_\uf8ff`)
      .limitToLast(boundedLimit + 1).once("value"));
    const matching = candidates.filter(({ value }) => String(value.rigger_email ?? "").trim().toLowerCase() === email)
      .sort((a, b) => String(b.value.created_datetime ?? "").localeCompare(String(a.value.created_datetime ?? "")) || b.key.localeCompare(a.key));
    return { rows: matching.slice(0, boundedLimit).map(({ key, value }) => mapRawAssignmentToListItem(key, value)), exceededLimit: candidates.length > boundedLimit };
  }
  async findRecentByTowerId(
    towerId: string,
    limit = RELATED_ASSIGNMENT_DEFAULT_LIMIT,
  ): Promise<AssignmentListItem[]> {
    const exactTowerId = towerId.trim();
    if (!exactTowerId) return [];
    const boundedLimit = Math.min(
      RELATED_ASSIGNMENT_MAXIMUM_LIMIT,
      Math.max(1, Math.trunc(limit)),
    );
    const snapshot = await this.database
      .ref(ASSIGNMENT_RTDB_PATH)
      .orderByChild("tower_id")
      .equalTo(exactTowerId)
      .limitToLast(boundedLimit)
      .once("value");
    return snapshotEntries(snapshot)
      .sort(
        (a, b) =>
          String(b.value.created_datetime ?? "").localeCompare(
            String(a.value.created_datetime ?? ""),
          ) || b.key.localeCompare(a.key),
      )
      .map(({ key, value }) => mapRawAssignmentToListItem(key, value));
  }
  async list(input: AssignmentListQueryInput): Promise<AssignmentListItem[]> {
    const rows = await this.readMatching(input);
    return this.normalizeAndSlice(rows, input);
  }

  async readForExport(
    input: AssignmentListQueryInput,
    maximumRows: number,
  ): Promise<AssignmentExportReadResult> {
    const rows = await this.readMatching(input, maximumRows + 1, true);
    const normalized = this.normalizeAndSlice(rows, {
      ...input,
      page: 1,
      pageSize: maximumRows + 1,
    });
    return {
      rows: normalized.slice(0, maximumRows),
      exceededLimit: normalized.length > maximumRows,
    };
  }

  private normalizeAndSlice(rows: RawAssignmentSnapshotEntry[], input: AssignmentListQueryInput) {
    const unique = new Map(rows.map((entry) => [entry.key, entry]));
    const sorted = [...unique.values()].sort((a, b) =>
      String(b.value.created_datetime ?? "").localeCompare(String(a.value.created_datetime ?? "")),
    );
    const now = this.now();
    const matching = sorted.filter(({ value }) => matchesAssignmentSlaFilters(value, input, now));
    const start = Math.max(0, (input.page - 1) * input.pageSize);
    return matching
      .slice(start, start + input.pageSize)
      .map(({ key, value }) => ({
        ...mapRawAssignmentToListItem(key, value),
        sla: evaluateAssignmentSla(value, now),
      }));
  }

  private async readMatching(
    input: AssignmentListQueryInput,
    maximum?: number,
    exportMode = false,
  ) {
    const startDate = assertAssignmentQueryDate(input.startDate);
    const endDate = assertAssignmentQueryDate(input.endDate);
    const base = this.database.ref(ASSIGNMENT_RTDB_PATH);

    if (input.searchType === "assignmentId" && input.searchValue) {
      const found = await this.findByAssignmentId(input.searchValue);
      return found.filter(
        ({ value }) => matchesDate(value, input) && matchesActiveFilter(value, input),
      );
    }

    if (input.searchType === "towerId" && input.searchValue) {
      const field = assignmentSearchField("towerId", input.timeBasis);
      const range = buildTowerSearchRange(input.searchValue, startDate, endDate);
      const query = limited(
        base.orderByChild(field).startAt(range.startAt).endAt(range.endAt),
        maximum,
      );
      return snapshotEntries(await query.once("value")).filter(({ value }) =>
        matchesActiveFilter(value, input),
      );
    }

    if (!input.filterCategory || !input.filterValues?.length) {
      const field = getAssignmentQueryField(input.timeBasis);
      const range = buildAssignmentDateRange(startDate, endDate);
      return snapshotEntries(
        await limited(
          base.orderByChild(field).startAt(range.startAt).endAt(range.endAt),
          maximum,
        ).once("value"),
      );
    }

    const field = getAssignmentQueryField(input.timeBasis, input.filterCategory);
    const rows: RawAssignmentSnapshotEntry[] = [];
    for (const value of input.filterValues) {
      if (maximum && rows.length >= maximum) break;
      const remaining = maximum ? maximum - rows.length : undefined;
      const formatted = normalizeFilterValue(input.filterCategory, value);
      const range = buildAssignmentCompositeRange(formatted, startDate, endDate);
      if (input.filterCategory === "status" && !exportMode) {
        const snapshot = await base
          .orderByChild("assignment_state")
          .equalTo(formatted)
          .once("value");
        rows.push(
          ...snapshotEntries(snapshot).filter(({ value: record }) => {
            const composite = record[field];
            return (
              typeof composite === "string" &&
              composite >= range.startAt &&
              composite <= range.endAt
            );
          }),
        );
      } else {
        const query = limited(
          base.orderByChild(field).startAt(range.startAt).endAt(range.endAt),
          remaining,
        );
        rows.push(...snapshotEntries(await query.once("value")));
      }
    }
    return rows;
  }
}
