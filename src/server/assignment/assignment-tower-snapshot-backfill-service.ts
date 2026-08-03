import "server-only";
import type { DataSnapshot, Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import type { RawAssignmentRecord } from "@/features/assignment/assignment-types";
import {
  ASSIGNMENT_SNAPSHOT_COMMIT_LIMIT,
  ASSIGNMENT_SNAPSHOT_CONFIRMATION,
  ASSIGNMENT_SNAPSHOT_PREVIEW_LIMIT,
  ASSIGNMENT_TOWER_SNAPSHOT_FIELDS,
  classifySnapshotAssignment,
  missingAssignmentSnapshotFields,
  type AssignmentSnapshotBackfillResult,
  type AssignmentSnapshotBackfillRow,
} from "@/features/assignment/assignment-tower-snapshot-contract";
import type { TowerAuditActor } from "@/features/tower/tower-audit-contract";
const text = (value: unknown) => String(value ?? "").trim();
const present = (record: Record<string, unknown>, field: string) =>
  Object.hasOwn(record, field) &&
  record[field] !== undefined &&
  record[field] !== null &&
  !(typeof record[field] === "string" && !record[field].trim());
const selected = (record: Record<string, unknown>) =>
  Object.fromEntries(
    ASSIGNMENT_TOWER_SNAPSHOT_FIELDS.filter((field) => present(record, field)).map((field) => [
      field,
      record[field],
    ]),
  );
const same = (left: Record<string, unknown>, right: Record<string, unknown>) =>
  ASSIGNMENT_TOWER_SNAPSHOT_FIELDS.every(
    (field) => (left[field] ?? null) === (right[field] ?? null),
  );
export class AssignmentSnapshotBackfillError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
type ImageRow = { key: string; value: Record<string, unknown> };
export class AssignmentTowerSnapshotBackfillService {
  constructor(
    private readonly db: Database = firebaseAdminDatabase,
    private readonly now = () => new Date(),
  ) {}
  private async images(assignmentId: string) {
    const snapshot = await this.db
        .ref("image")
        .orderByChild("assignment_id")
        .equalTo(assignmentId)
        .once("value"),
      rows: ImageRow[] = [];
    snapshot.forEach((child: DataSnapshot) => {
      rows.push({ key: child.key ?? "", value: child.val() ?? {} });
    });
    return rows;
  }
  private async classify(
    assignmentKey: string,
    record: RawAssignmentRecord,
  ): Promise<AssignmentSnapshotBackfillRow> {
    const assignmentId = text(record.assignment_id),
      towerId = text(record.tower_id),
      status = text(record.assignment_state ?? record.assignment_status),
      missingFields = missingAssignmentSnapshotFields(record as Record<string, unknown>);
    if (!missingFields.length)
      return {
        assignmentKey,
        assignmentId,
        towerKey: null,
        towerId,
        status,
        classification: "already_complete",
        missingFields,
        reason: "Assignment Full Tower snapshot is complete.",
      };
    const lifecycle = classifySnapshotAssignment(record as Record<string, unknown>);
    if (lifecycle === "historical")
      return {
        assignmentKey,
        assignmentId,
        towerKey: null,
        towerId,
        status,
        classification: "historical_preserved",
        missingFields,
        reason: "Historical Assignments were not modified.",
      };
    if (lifecycle === "blocked")
      return {
        assignmentKey,
        assignmentId,
        towerKey: null,
        towerId,
        status,
        classification: "blocked",
        missingFields,
        reason: "Assignment status requires reconciliation.",
      };
    if (!assignmentId)
      return {
        assignmentKey,
        assignmentId,
        towerKey: null,
        towerId,
        status,
        classification: "blocked",
        missingFields,
        reason: "Assignment has no assignment_id relationship.",
      };
    const images = await this.images(assignmentId);
    if (!images.length)
      return {
        assignmentKey,
        assignmentId,
        towerKey: null,
        towerId,
        status,
        classification: "image_missing",
        missingFields,
        reason: "No Full Tower image record matches assignment_id.",
      };
    const reference = selected(images[0].value),
      identical = images.every((image) => same(reference, selected(image.value))),
      available = missingFields.filter((field) => present(reference, field));
    if (images.length > 1 && !identical) {
      const conflicts = ASSIGNMENT_TOWER_SNAPSHOT_FIELDS.filter((field) =>
        images.some(
          (image) => (selected(image.value)[field] ?? null) !== (reference[field] ?? null),
        ),
      );
      return {
        assignmentKey,
        assignmentId,
        towerKey: images.map((image) => image.key).join("|"),
        towerId,
        status,
        classification: "image_duplicate_conflicting",
        missingFields,
        reason: `Conflicting Full Tower image fields: ${conflicts.join(", ")}.`,
      };
    }
    const imageClass = images.length === 1 ? "image_single_match" : "image_duplicate_identical";
    return {
      assignmentKey,
      assignmentId,
      towerKey: images.map((image) => image.key).join("|"),
      towerId,
      status,
      classification: available.length ? "repairable" : imageClass,
      sourceClassification: imageClass,
      missingFields,
      reason: available.length
        ? `${imageClass}: missing fields can be added from /image.`
        : "Matching /image records have no available values for missing fields.",
    };
  }
  async preview(): Promise<AssignmentSnapshotBackfillResult> {
    const snapshot = await this.db
        .ref("assignment")
        .orderByKey()
        .limitToLast(ASSIGNMENT_SNAPSHOT_PREVIEW_LIMIT + 1)
        .once("value"),
      entries: { key: string; value: RawAssignmentRecord }[] = [];
    snapshot.forEach((child) => {
      entries.push({ key: child.key ?? "", value: child.val() ?? {} });
    });
    const bounded = entries.length > ASSIGNMENT_SNAPSHOT_PREVIEW_LIMIT,
      rows: AssignmentSnapshotBackfillRow[] = [];
    for (const entry of entries.slice(-ASSIGNMENT_SNAPSHOT_PREVIEW_LIMIT))
      rows.push(await this.classify(entry.key, entry.value));
    const count = (value: string) => rows.filter((row) => row.classification === value).length;
    return {
      scannedCount: rows.length,
      repairableActiveCount: count("repairable"),
      historicalCount: count("historical_preserved"),
      alreadyCompleteCount: count("already_complete"),
      missingTowerCount: count("image_missing"),
      ambiguousCount: count("image_duplicate_conflicting"),
      blockedCount: count("blocked"),
      fieldCounts: Object.fromEntries(
        ASSIGNMENT_TOWER_SNAPSHOT_FIELDS.map((field) => [
          field,
          rows.filter((row) => row.missingFields.includes(field)).length,
        ]),
      ),
      rows,
      bounded,
    };
  }
  async commit(input: unknown, actor: TowerAuditActor) {
    const body =
      input && typeof input === "object" && !Array.isArray(input)
        ? (input as Record<string, unknown>)
        : {};
    if (body.mode !== "active_only")
      throw new AssignmentSnapshotBackfillError(400, "Only active_only mode is supported.");
    if (body.confirmation !== ASSIGNMENT_SNAPSHOT_CONFIRMATION)
      throw new AssignmentSnapshotBackfillError(
        400,
        `Type ${ASSIGNMENT_SNAPSHOT_CONFIRMATION} to confirm.`,
      );
    const keys = Array.isArray(body.assignmentKeys)
      ? [
          ...new Set(
            body.assignmentKeys.filter(
              (key): key is string => typeof key === "string" && /^[A-Za-z0-9_-]{1,160}$/.test(key),
            ),
          ),
        ].slice(0, ASSIGNMENT_SNAPSHOT_COMMIT_LIMIT)
      : [];
    if (!keys.length)
      throw new AssignmentSnapshotBackfillError(400, "Select at least one previewed Assignment.");
    const batchId =
        this.db.ref("assignment_snapshot_backfill").push().key ?? `batch-${this.now().getTime()}`,
      rows: AssignmentSnapshotBackfillRow[] = [];
    for (const assignmentKey of keys) {
      const snapshot = await this.db.ref(`assignment/${assignmentKey}`).once("value");
      if (!snapshot.exists()) {
        rows.push({
          assignmentKey,
          assignmentId: "",
          towerKey: null,
          towerId: "",
          status: "",
          classification: "failed",
          missingFields: [],
          repairedFields: [],
          reason: "Assignment no longer exists.",
          result: "failed",
          message: "Assignment no longer exists.",
        });
        continue;
      }
      const record = snapshot.val() as RawAssignmentRecord,
        row = await this.classify(assignmentKey, record);
      if (row.classification !== "repairable") {
        rows.push({ ...row, repairedFields: [], result: row.classification, message: row.reason });
        continue;
      }
      const auditKey = this.db.ref(`assignment_audit/${assignmentKey}`).push().key;
      if (!auditKey) {
        rows.push({
          ...row,
          repairedFields: [],
          result: "failed",
          message: "Audit key generation failed.",
        });
        continue;
      }
      let repaired: string[] = [];
      const outcome = await this.db.ref().transaction(
        (root) => {
          const assignment = root?.assignment?.[assignmentKey];
          if (!assignment || classifySnapshotAssignment(assignment) !== "eligible") return;
          const imageEntries = Object.entries(root.image ?? {}).filter(
            ([, value]) =>
              (value as Record<string, unknown>)?.assignment_id === assignment.assignment_id,
          ) as [string, Record<string, unknown>][];
          if (!imageEntries.length) return;
          const reference = selected(imageEntries[0][1]);
          if (!imageEntries.every(([, value]) => same(reference, selected(value)))) return;
          const additions = Object.fromEntries(
            missingAssignmentSnapshotFields(assignment)
              .filter((field) => present(reference, field))
              .map((field) => [field, reference[field]]),
          );
          repaired = Object.keys(additions);
          if (!repaired.length) return;
          root.assignment[assignmentKey] = { ...assignment, ...additions };
          root.assignment_audit ??= {};
          root.assignment_audit[assignmentKey] ??= {};
          root.assignment_audit[assignmentKey][auditKey] = {
            audit_id: auditKey,
            assignment_key: assignmentKey,
            assignment_id: String(assignment.assignment_id ?? ""),
            source: "image",
            source_image_key: imageEntries[0][0],
            source_image_keys: imageEntries.map(([key]) => key),
            duplicate_classification:
              imageEntries.length === 1 ? "image_single_match" : "image_duplicate_identical",
            action: "assignment_full_tower_backfilled",
            reason: "full_tower_snapshot_backfill",
            batch_id: batchId,
            actor_uid: text(actor.uid).slice(0, 128),
            actor_email: text(actor.email).slice(0, 320),
            actor_name: text(actor.name).slice(0, 200),
            occurred_at: this.now().toISOString(),
            changed_fields: repaired,
            before: Object.fromEntries(repaired.map((field) => [field, null])),
            after: additions,
          };
          return root;
        },
        undefined,
        false,
      );
      rows.push({
        ...row,
        repairedFields: repaired,
        result: outcome.committed && repaired.length ? "repaired" : "failed",
        message:
          outcome.committed && repaired.length
            ? "Missing Full Tower snapshot fields were added from /image."
            : "Assignment or image source changed before repair.",
      });
    }
    return {
      batchId,
      mode: "active_only",
      attemptedCount: keys.length,
      repairedCount: rows.filter((row) => row.result === "repaired").length,
      rows,
    };
  }
}
