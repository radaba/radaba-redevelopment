import "server-only";
import type { DataSnapshot, Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import type {
  RawAssignmentRecord,
  RawAssignmentSnapshotEntry,
} from "@/features/assignment/assignment-types";
import {
  buildRiggerDependentFields,
  buildRevisitedAssignment,
  isCompletedAssignment,
  isRiggerAssignmentChange,
  type AssignmentReference,
  type AssignmentRevisitEvent,
  type ResolvedAssignmentUser,
} from "@/features/assignment/assignment-command-contract";
import {
  buildAssignmentTransition,
  type AssignmentTransitionAction,
} from "@/features/assignment/assignment-workflow";
import type { AssignmentCommandRepository, ResolvedTower } from "./assignment-command-repository";
import {
  buildAssignmentChecklist,
  buildAssignmentWorkReport,
  canEditAssignmentExecution,
  type AssignmentChecklistUpdate,
  type AssignmentExecutionActor,
  type AssignmentWorkReportUpdate,
} from "@/features/assignment/assignment-execution-contract";
import {
  assignmentRiggerBaseline,
  changedAssignmentRiggerBaselineFields,
} from "@/features/assignment/assignment-rigger-reassignment-contract";

const text = (v: unknown) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v));
const entries = (s: DataSnapshot) => {
  const out: RawAssignmentSnapshotEntry[] = [];
  s.forEach((c) => {
    out.push({ key: c.key ?? "", value: c.val() as RawAssignmentRecord });
  });
  return out;
};
function mapUser(s: DataSnapshot): ResolvedAssignmentUser {
  const v = s.val() as Record<string, unknown>;
  return {
    key: s.key ?? "",
    uid: text(v.uid) || null,
    name: text(v.name),
    email: text(v.email).toLowerCase(),
    role: text(v.role),
    position: text(v.position),
    status: text(v.status),
    company: text(v.company) || null,
  };
}
function eligible(u: ResolvedAssignmentUser, kind: "rno" | "rigger" | "coordinator") {
  if (u.status.toLowerCase() !== "active" || !u.name || !u.email) return false;
  if (kind === "rigger") return u.position.toLowerCase() === "rigger";
  if (kind === "rno") return ["l0_rno", "l1_rno", "l2_rno"].includes(u.role.toLowerCase());
  return u.position.toLowerCase() !== "rigger";
}

export class FirebaseAssignmentCommandRepository implements AssignmentCommandRepository {
  constructor(private readonly db: Database = firebaseAdminDatabase) {}
  async findByKey(key: string) {
    const snapshot = await this.db.ref("assignment").child(key).once("value");
    return snapshot.exists()
      ? { key: snapshot.key ?? key, value: snapshot.val() as RawAssignmentRecord }
      : null;
  }
  async findTower(key: string): Promise<ResolvedTower | null> {
    const s = await this.db.ref("tower").child(key).once("value");
    return s.exists() ? { key, record: s.val() as RawAssignmentRecord } : null;
  }
  async findTowerByTowerId(id: string) {
    const s = await this.db
      .ref("tower")
      .orderByChild("tower_id")
      .equalTo(id.trim().toUpperCase())
      .limitToFirst(2)
      .once("value");
    const found: ResolvedTower[] = [];
    s.forEach((c) => {
      found.push({ key: c.key ?? "", record: c.val() as RawAssignmentRecord });
    });
    return found.length === 1 ? found[0] : null;
  }
  async findUser(key: string) {
    const s = await this.db.ref("user").child(key).once("value");
    return s.exists() ? mapUser(s) : null;
  }
  async findUserByEmail(email: string) {
    const s = await this.db
      .ref("user")
      .orderByChild("email")
      .equalTo(email.trim().toLowerCase())
      .limitToFirst(2)
      .once("value");
    const found: ResolvedAssignmentUser[] = [];
    s.forEach((c) => {
      found.push(mapUser(c));
    });
    return found.length === 1 ? found[0] : null;
  }
  async findCategory(name: string) {
    return (await this.listCategories()).find((c) => c.name === name.trim()) ?? null;
  }
  async findByAssignmentId(id: string) {
    return entries(
      await this.db.ref("assignment").orderByChild("assignment_id").equalTo(id).once("value"),
    );
  }
  async findByTowerId(id: string) {
    return entries(
      await this.db.ref("assignment").orderByChild("tower_id").equalTo(id).once("value"),
    );
  }
  reserveRevisitKey(assignmentKey: string) {
    const key = this.db.ref("assignment").child(assignmentKey).child("revisit_history").push().key;
    if (!key) throw new Error("Could not reserve revisit event key.");
    return key;
  }
  reserveAssignmentKey() {
    const key = this.db.ref("assignment").push().key;
    if (!key) throw new Error("Could not reserve Assignment key.");
    return key;
  }
  async createAssignment(key: string, record: RawAssignmentRecord) {
    await this.db.ref("assignment").child(key).set(record);
  }
  async createAssignments(records: Record<string, RawAssignmentRecord>) {
    const updates = Object.fromEntries(
      Object.entries(records).map(([key, value]) => [`assignment/${key}`, value]),
    );
    await this.db.ref().update(updates);
  }
  async revisitAssignment(
    key: string,
    eventKey: string,
    event: AssignmentRevisitEvent,
  ): Promise<
    | { outcome: "updated"; revisitCount: number }
    | { outcome: "not-completed" }
    | { outcome: "missing" }
  > {
    let outcome: "updated" | "not-completed" | "missing" = "missing";
    let revisitCount = 0;
    const result = await this.db
      .ref("assignment")
      .child(key)
      .transaction(
        (current) => {
          if (!current) {
            outcome = "missing";
            return;
          }
          const record = current as RawAssignmentRecord;
          if (!isCompletedAssignment(record)) {
            outcome = "not-completed";
            return;
          }
          const revisited = buildRevisitedAssignment(record, eventKey, event);
          revisitCount = revisited.revisitCount;
          outcome = "updated";
          return revisited.record;
        },
        undefined,
        false,
      );
    return result.committed ? { outcome: "updated", revisitCount } : { outcome };
  }
  async updateRiggerIfMutable(
    key: string,
    rigger: { name: string; email: string },
  ): Promise<"updated" | "unchanged" | "completed" | "missing"> {
    let outcome: "updated" | "unchanged" | "completed" | "missing" = "missing";
    const result = await this.db
      .ref("assignment")
      .child(key)
      .transaction(
        (current) => {
          if (!current) {
            outcome = "missing";
            return;
          }
          const record = current as RawAssignmentRecord;
          if (!isRiggerAssignmentChange(record, rigger)) {
            outcome = "unchanged";
            return;
          }
          if (isCompletedAssignment(record)) {
            outcome = "completed";
            return;
          }
          outcome = "updated";
          return { ...record, ...buildRiggerDependentFields(record, rigger) };
        },
        undefined,
        false,
      );
    return result.committed ? "updated" : outcome;
  }
  async reassignRiggerByKey(input: {
    assignmentKey: string;
    assignmentId: string;
    expected: Record<string, unknown>;
    rigger: ResolvedAssignmentUser;
    actor: { uid: string; name: string; email: string };
    occurredAt: string;
  }) {
    const assignmentRef = this.db.ref("assignment").child(input.assignmentKey);
    const confirmedSnapshot = await assignmentRef.get();
    if (!confirmedSnapshot.exists())
      return {
        outcome: "missing",
        transactionSnapshotExists: false,
        transactionCommitted: false,
      } as const;
    const confirmedRecord = confirmedSnapshot.val() as RawAssignmentRecord;
    const preReadChangedFields = changedAssignmentRiggerBaselineFields(
      confirmedRecord,
      input.expected,
    );
    if (process.env.NODE_ENV === "development" && preReadChangedFields.length)
      console.info("assignment_reassignment_baseline_diff", {
        assignmentKey: input.assignmentKey,
        assignmentId: input.assignmentId,
        stage: "pre_read",
        baseline: assignmentRiggerBaseline(input.expected),
        current: assignmentRiggerBaseline(confirmedRecord),
        changedFields: preReadChangedFields,
      });
    if (text(confirmedRecord.assignment_id) !== input.assignmentId || preReadChangedFields.length)
      return {
        outcome: "changed",
        transactionSnapshotExists: true,
        transactionCommitted: false,
      } as const;
    const confirmedBaseline = assignmentRiggerBaseline(confirmedRecord);
    let abortReason: "unchanged" | "changed" | "completed" | "transaction-conflict" | null = null;
    let transactionSnapshotExists = false;
    let callbackCount = 0;
    let observedNonNullTransactionValue = false;
    let before: RawAssignmentRecord | null = null;
    const transactionPath = `assignment/${input.assignmentKey}`;
    const transaction = await assignmentRef.transaction(
      (current) => {
        callbackCount++;
        const currentIsNull = current === null;
        if (!currentIsNull) observedNonNullTransactionValue = true;
        transactionSnapshotExists = transactionSnapshotExists || !currentIsNull;
        if (currentIsNull && observedNonNullTransactionValue) {
          abortReason = "changed";
          if (process.env.NODE_ENV === "development")
            console.info("assignment_reassignment_transaction_callback", {
              assignmentKey: input.assignmentKey,
              callbackCount,
              currentIsNull,
              currentAssignmentId: null,
              updaterReturn: "abort_assignment_changed",
            });
          return;
        }
        const record = (currentIsNull ? confirmedRecord : current) as RawAssignmentRecord;
        const transactionChangedFields = changedAssignmentRiggerBaselineFields(
          record,
          confirmedBaseline,
        );
        if (text(record.assignment_id) !== input.assignmentId || transactionChangedFields.length) {
          if (process.env.NODE_ENV === "development")
            console.info("assignment_reassignment_baseline_diff", {
              assignmentKey: input.assignmentKey,
              assignmentId: input.assignmentId,
              stage: "transaction",
              baseline: confirmedBaseline,
              current: assignmentRiggerBaseline(record),
              changedFields: transactionChangedFields,
            });
          abortReason = "changed";
          return;
        }
        if (!isRiggerAssignmentChange(record, input.rigger)) {
          abortReason = "unchanged";
          return;
        }
        if (isCompletedAssignment(record)) {
          abortReason = "completed";
          return;
        }
        before = record;
        if (process.env.NODE_ENV === "development")
          console.info("assignment_reassignment_transaction_callback", {
            assignmentKey: input.assignmentKey,
            callbackCount,
            currentIsNull,
            currentAssignmentId: text(record.assignment_id),
            updaterReturn: "updated_candidate",
          });
        return { ...record, ...buildRiggerDependentFields(record, input.rigger) };
      },
      undefined,
      false,
    );
    if (process.env.NODE_ENV === "development")
      console.info("assignment_reassignment_trace", {
        commandAssignmentKey: input.assignmentKey,
        transactionPath,
        preReadExists: confirmedSnapshot.exists(),
        preReadAssignmentId: text(confirmedRecord.assignment_id),
        callbackCount,
        transactionSnapshotExists,
        resultSnapshotExists: transaction.snapshot.exists(),
        transactionCommitted: transaction.committed,
        internalErrorCode: transaction.committed ? null : (abortReason ?? "transaction_conflict"),
      });
    if (!transaction.committed)
      return {
        outcome: abortReason ?? "transaction-conflict",
        transactionSnapshotExists,
        transactionCommitted: false,
      } as const;
    if (!before || !transaction.snapshot.exists())
      return {
        outcome: "transaction-conflict",
        transactionSnapshotExists,
        transactionCommitted: true,
      } as const;

    const [images, cells] = await Promise.all([
      this.db.ref("image").orderByChild("assignment_id").equalTo(input.assignmentId).once("value"),
      this.db.ref("cell").orderByChild("assignment_id").equalTo(input.assignmentId).once("value"),
    ]);
    const updates: Record<string, unknown> = {};
    let imageCount = 0,
      cellCount = 0;
    const dependentFields = { rigger_name: input.rigger.name, rigger_email: input.rigger.email };
    images.forEach((child) => {
      const value = child.val() as Record<string, unknown>;
      if (Object.hasOwn(value, "rigger_name") || Object.hasOwn(value, "rigger_email")) {
        updates[`image/${child.key}`] = { ...value, ...dependentFields };
        imageCount++;
      }
    });
    cells.forEach((child) => {
      const value = child.val() as Record<string, unknown>;
      if (Object.hasOwn(value, "rigger_name") || Object.hasOwn(value, "rigger_email")) {
        updates[`cell/${child.key}`] = { ...value, ...dependentFields };
        cellCount++;
      }
    });
    const auditKey = this.db.ref(`assignment_audit/${input.assignmentKey}`).push().key;
    if (!auditKey) return { outcome: "dependent-failed" } as const;
    const previous = before as RawAssignmentRecord;
    updates[`assignment_audit/${input.assignmentKey}/${auditKey}`] = {
      audit_id: auditKey,
      assignment_key: input.assignmentKey,
      assignment_id: input.assignmentId,
      action: "rigger_reassigned",
      reason: "rigger_reassignment",
      previous_rigger_uid: null,
      previous_rigger_name: text(previous.rigger_name),
      previous_rigger_email: text(previous.rigger_email),
      new_rigger_key: input.rigger.key,
      new_rigger_uid: input.rigger.uid,
      new_rigger_name: input.rigger.name,
      new_rigger_email: input.rigger.email,
      actor_uid: input.actor.uid,
      actor_name: input.actor.name,
      actor_email: input.actor.email,
      occurred_at: input.occurredAt,
      image_records_updated: imageCount,
      cell_records_updated: cellCount,
      concurrency_before: input.expected,
      concurrency_after: {
        assignment_id: input.assignmentId,
        rigger_name: input.rigger.name,
        rigger_email: input.rigger.email,
      },
    };
    try {
      await this.db.ref().update(updates);
    } catch {
      return { outcome: "dependent-failed" } as const;
    }
    return {
      outcome: "updated",
      imageCount,
      cellCount,
      transactionSnapshotExists,
      transactionCommitted: true,
    } as const;
  }
  async transitionAssignment(
    key: string,
    action: AssignmentTransitionAction,
    timestamp: { date: string; datetime: string },
    actor: { uid: string; name: string },
  ): Promise<"updated" | "invalid-transition" | "missing"> {
    let outcome: "updated" | "invalid-transition" | "missing" = "missing";
    const result = await this.db
      .ref("assignment")
      .child(key)
      .transaction(
        (current) => {
          if (!current) {
            outcome = "missing";
            return;
          }
          const record = current as RawAssignmentRecord;
          const fields = buildAssignmentTransition(record, action, timestamp, actor);
          if (!fields) {
            outcome = "invalid-transition";
            return;
          }
          outcome = "updated";
          return { ...record, ...fields };
        },
        undefined,
        false,
      );
    return result.committed ? "updated" : outcome;
  }
  private async updateExecution(
    key: string,
    kind: "checklist" | "report",
    input: AssignmentChecklistUpdate | AssignmentWorkReportUpdate,
    actor: AssignmentExecutionActor,
    timestamp: string,
  ): Promise<"updated" | "completed" | "permission-denied" | "stale-revision" | "missing"> {
    let outcome: "updated" | "completed" | "permission-denied" | "stale-revision" | "missing" =
      "missing";
    const result = await this.db
      .ref("assignment")
      .child(key)
      .transaction(
        (current) => {
          if (!current) {
            outcome = "missing";
            return;
          }
          const record = current as RawAssignmentRecord;
          if (isCompletedAssignment(record)) {
            outcome = "completed";
            return;
          }
          if (!canEditAssignmentExecution(record, actor)) {
            outcome = "permission-denied";
            return;
          }
          const value =
            kind === "checklist"
              ? buildAssignmentChecklist(
                  record,
                  input as AssignmentChecklistUpdate,
                  actor,
                  timestamp,
                )
              : buildAssignmentWorkReport(
                  record,
                  input as AssignmentWorkReportUpdate,
                  actor,
                  timestamp,
                );
          if (!value) {
            outcome = "stale-revision";
            return;
          }
          outcome = "updated";
          return { ...record, [kind === "checklist" ? "work_checklist" : "work_report"]: value };
        },
        undefined,
        false,
      );
    return result.committed ? "updated" : outcome;
  }
  updateChecklist(
    key: string,
    input: AssignmentChecklistUpdate,
    actor: AssignmentExecutionActor,
    timestamp: string,
  ) {
    return this.updateExecution(key, "checklist", input, actor, timestamp);
  }
  updateWorkReport(
    key: string,
    input: AssignmentWorkReportUpdate,
    actor: AssignmentExecutionActor,
    timestamp: string,
  ) {
    return this.updateExecution(key, "report", input, actor, timestamp);
  }
  async listTowers(search: string, limit: number) {
    const q = search.trim().toUpperCase();
    const s = await this.db
      .ref("tower")
      .orderByChild("tower_id")
      .startAt(q)
      .endAt(`${q}\uf8ff`)
      .limitToFirst(limit)
      .once("value");
    const out: AssignmentReference[] = [];
    s.forEach((c) => {
      const v = c.val() as Record<string, unknown>;
      out.push({ key: c.key ?? "", name: text(v.tower_id), secondary: text(v.sitename) || null });
    });
    return out;
  }
  async listUsers(search: string, kind: "rno" | "rigger" | "coordinator", limit: number) {
    const q = search.trim();
    const s = await this.db
      .ref("user")
      .orderByChild("name")
      .startAt(q)
      .endAt(`${q}\uf8ff`)
      .limitToFirst(Math.min(limit * 3, 60))
      .once("value");
    const out: AssignmentReference[] = [];
    s.forEach((c) => {
      const u = mapUser(c);
      if (eligible(u, kind) && out.length < limit)
        out.push({ key: u.key, name: u.name, secondary: u.company });
    });
    return out;
  }
  async listCategories() {
    const s = await this.db.ref("category/assignment").once("value");
    const out: AssignmentReference[] = [];
    s.forEach((c) => {
      const n = text((c.val() as Record<string, unknown>)?.name);
      if (n) out.push({ key: n, name: n });
    });
    return out;
  }
}
