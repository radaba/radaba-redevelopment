import type { RawAssignmentRecord } from "@/features/assignment/assignment-types";
import {
  ASSIGNMENT_INITIAL_FTP_CHECK,
  ASSIGNMENT_INITIAL_STATE,
  ASSIGNMENT_INITIAL_STATUS,
  ASSIGNMENT_REVISIT_STATE,
  buildAssignmentId,
  buildCreatedAssignmentComposites,
  buildRiggerDependentFields,
  isCompletedAssignment,
  isRiggerAssignmentChange,
  isTerminalAssignment,
  jakartaParts,
  type AssignmentCreateInput,
  type AssignmentRevisitActor,
} from "@/features/assignment/assignment-command-contract";
import {
  availableAssignmentTransitions,
  type AssignmentTransitionAction,
} from "@/features/assignment/assignment-workflow";
import type { AssignmentCommandRepository } from "./assignment-command-repository";
import type { NotificationProducer } from "@/server/notification/firebase-notification-producer";
import { AssignmentCommandError } from "./assignment-command-errors";
import { isAssignmentFirebasePushKey } from "@/features/assignment/assignment-rigger-reassignment-contract";
const required = (v: string, name: string) => {
  const x = v?.trim();
  if (!x) throw new AssignmentCommandError("invalid-input", `${name} is required.`);
  return x;
};
const towerFields = [
  "tower_id",
  "sitename",
  "site_type",
  "latitude",
  "longitude",
  "region",
  "sub_region",
  "province",
  "kabupaten",
  "kecamatan",
  "new_cluster_name",
  "bts_type",
  "antenna_system",
  "antenna_type",
  "g900",
  "g1800",
  "u900",
  "u2100",
  "l850",
  "l900",
  "l1800",
  "l2100",
  "l2300",
];
export interface PreparedAssignment {
  key: string;
  assignmentId: string;
  record: RawAssignmentRecord;
}
export class AssignmentCommandService {
  constructor(
    private repo: AssignmentCommandRepository,
    private now = () => new Date(),
    private notifications?: NotificationProducer,
  ) {}
  async prepareCreateAssignment(input: AssignmentCreateInput): Promise<PreparedAssignment> {
    const [tower, rno, rigger, coordinator, category] = await Promise.all([
      this.repo.findTower(required(input.towerKey, "Tower")),
      this.repo.findUser(required(input.rnoKey, "RNO")),
      this.repo.findUser(required(input.riggerKey, "Rigger")),
      this.repo.findUser(required(input.coordinatorKey, "Coordinator")),
      this.repo.findCategory(required(input.category, "Category")),
    ]);
    if (!tower) throw new AssignmentCommandError("tower-not-found", "Tower was not found.");
    if (!rno) throw new AssignmentCommandError("rno-not-found", "RNO was not found.");
    if (!rigger) throw new AssignmentCommandError("rigger-not-found", "Rigger was not found.");
    if (!coordinator)
      throw new AssignmentCommandError("coordinator-not-found", "Coordinator was not found.");
    if (!category)
      throw new AssignmentCommandError("category-not-found", "Category was not found.");
    if (
      !["l0_rno", "l1_rno", "l2_rno"].includes(rno.role.toLowerCase()) ||
      rno.status.toLowerCase() !== "active"
    )
      throw new AssignmentCommandError("rno-not-found", "RNO was not eligible.");
    if (rigger.position.toLowerCase() !== "rigger" || rigger.status.toLowerCase() !== "active")
      throw new AssignmentCommandError("rigger-not-found", "Rigger was not eligible.");
    if (
      coordinator.position.toLowerCase() === "rigger" ||
      coordinator.status.toLowerCase() !== "active"
    )
      throw new AssignmentCommandError("coordinator-not-found", "Coordinator was not eligible.");
    const towerId = String(tower.record.tower_id ?? "")
      .trim()
      .toUpperCase();
    if (!towerId) throw new AssignmentCommandError("tower-not-found", "Tower has no tower ID.");
    if ((await this.repo.findByTowerId(towerId)).some((x) => !isTerminalAssignment(x.value)))
      throw new AssignmentCommandError(
        "assignment-conflict",
        "An active Assignment already exists for this tower.",
      );
    const now = this.now(),
      parts = jakartaParts(now),
      id = buildAssignmentId(towerId, now);
    if ((await this.repo.findByAssignmentId(id)).length)
      throw new AssignmentCommandError("stale-record", "Assignment ID collision. Retry.");
    const record: RawAssignmentRecord = {};
    for (const f of towerFields) if (tower.record[f] !== undefined) record[f] = tower.record[f];
    Object.assign(record, {
      assignment_id: id,
      tower_id: towerId,
      assignment_category: category.name,
      assignment_description: input.description?.trim() || "",
      assignment_status: ASSIGNMENT_INITIAL_STATUS,
      assignment_state: ASSIGNMENT_INITIAL_STATE,
      ftp_check: ASSIGNMENT_INITIAL_FTP_CHECK,
      completed: false,
      company: rigger.company ?? "",
      rno_name: rno.name,
      rno_email: rno.email,
      rigger_name: rigger.name,
      rigger_email: rigger.email,
      coordinator_name: coordinator.name,
      coordinator_email: coordinator.email,
      created_date: parts.date,
      created_datetime: parts.datetime,
      timestamp: Math.floor(now.getTime() / 1000),
    });
    if (input.planDate) record.plan_date = input.planDate;
    Object.assign(
      record,
      buildCreatedAssignmentComposites(record),
      buildRiggerDependentFields(record, rigger),
    );
    const key = this.repo.reserveAssignmentKey();
    return { key, assignmentId: id, record };
  }
  async createAssignment(input: AssignmentCreateInput) {
    const prepared = await this.prepareCreateAssignment(input);
    await this.repo.createAssignment(prepared.key, prepared.record);
    await this.notifications?.deliver({type:"assignment_assigned",category:"assignment",title:"Assignment assigned",message:`Assignment ${prepared.assignmentId} was assigned.`,recipientEmails:[String(prepared.record.rigger_email??""),String(prepared.record.coordinator_email??""),String(prepared.record.rno_email??"")],targetType:"assignment",targetKey:prepared.key,targetId:prepared.assignmentId,route:`/home/assignment/${encodeURIComponent(prepared.key)}`,operationId:`assignment-create:${prepared.key}`});
    return { key: prepared.key, assignmentId: prepared.assignmentId };
  }
  async revisitAssignment(id: string, reason: string, actor: AssignmentRevisitActor) {
    const assignmentId = required(id, "Assignment ID");
    const revisitReason = required(reason, "Revisit reason");
    if (revisitReason.length > 2000)
      throw new AssignmentCommandError(
        "invalid-input",
        "Revisit reason must be 2,000 characters or fewer.",
      );
    const found = await this.repo.findByAssignmentId(assignmentId);
    if (found.length !== 1)
      throw new AssignmentCommandError(
        found.length ? "stale-record" : "assignment-not-found",
        found.length ? "Assignment identity is ambiguous." : "Assignment was not found.",
      );
    const current = found[0].value;
    if (!isCompletedAssignment(current))
      throw new AssignmentCommandError(
        "ASSIGNMENT_NOT_COMPLETED",
        "Only completed assignments can be revisited.",
      );
    const eventKey = this.repo.reserveRevisitKey(found[0].key);
    const event = {
      action: "Assignment Revisited" as const,
      at: jakartaParts(this.now()).datetime,
      by_uid: required(actor.uid, "Actor UID"),
      by_name: required(actor.name, "Actor name"),
      reason: revisitReason,
      previous_status: String(current.assignment_state ?? current.assignment_status ?? "Completed"),
      new_status: ASSIGNMENT_REVISIT_STATE,
      previous_completed_at:
        String(current.completed_datetime ?? current.closed_datetime ?? "").trim() || null,
    };
    const result = await this.repo.revisitAssignment(found[0].key, eventKey, event);
    if (result.outcome === "not-completed")
      throw new AssignmentCommandError(
        "ASSIGNMENT_NOT_COMPLETED",
        "Only completed assignments can be revisited.",
      );
    if (result.outcome === "missing")
      throw new AssignmentCommandError(
        "stale-record",
        "Assignment changed before it could be revisited. Refresh and try again.",
      );
    await this.notifications?.deliver({ type: "assignment_revisit", category: "assignment", title: "Assignment revisit started", message: `Assignment ${assignmentId} was reopened for additional work.`, recipientEmails: [String(current.rigger_email ?? ""), String(current.coordinator_email ?? ""), String(current.rno_email ?? "")], actorName: actor.name, targetType: "assignment", targetKey: found[0].key, targetId: assignmentId, route: `/home/assignment/${encodeURIComponent(found[0].key)}`, severity: "warning", operationId: `assignment-revisit:${eventKey}` });
    console.info("Assignment revisited", {
      actorUid: event.by_uid,
      assignmentKey: found[0].key,
      eventKey,
      previousStatus: event.previous_status,
      newStatus: event.new_status,
    });
    return {
      key: found[0].key,
      assignmentId,
      state: ASSIGNMENT_REVISIT_STATE,
      revisitCount: result.revisitCount,
    };
  }
  async reassignRigger(
    input: {
      assignmentKey: string;
      assignmentId: string;
      riggerKey: string;
      expected: Record<string, unknown>;
    },
    actor: { uid: string; name: string; email: string },
  ) {
    const assignmentKey = required(input.assignmentKey, "Assignment key");
    if (!isAssignmentFirebasePushKey(assignmentKey))
      throw new AssignmentCommandError(
        "invalid_assignment_key",
        "The Assignment reference is invalid.",
      );
    const assignmentId = required(input.assignmentId, "Assignment ID");
    const found = await this.repo.findByKey(assignmentKey);
    if (process.env.NODE_ENV === "development")
      console.info("assignment_reassignment_trace", {
        commandAssignmentKey: assignmentKey,
        repositorySnapshotKey: found?.key ?? null,
        recordAssignmentId: String(found?.value.assignment_id ?? ""),
        internalErrorCode: found ? null : "assignment_not_found",
      });
    if (!found)
      throw new AssignmentCommandError("assignment-not-found", "Assignment was not found.");
    if (String(found.value.assignment_id ?? "").trim() !== assignmentId)
      throw new AssignmentCommandError(
        "assignment_identity_mismatch",
        "The Assignment identity changed. Refresh the page before reassigning.",
      );
    const r = await this.repo.findUser(required(input.riggerKey, "Rigger"));
    if (!r || r.status.toLowerCase() !== "active" || r.position.toLowerCase() !== "rigger")
      throw new AssignmentCommandError("rigger-not-found", "Rigger was not found or eligible.");
    if (isCompletedAssignment(found.value) && isRiggerAssignmentChange(found.value, r))
      throw new AssignmentCommandError(
        "ASSIGNMENT_COMPLETED",
        "Rigger cannot be reassigned because the assignment has already been completed.",
      );
    const result = await this.repo.reassignRiggerByKey({
      assignmentKey,
      assignmentId,
      expected: input.expected,
      rigger: r,
      actor,
      occurredAt: this.now().toISOString(),
    });
    if (result.outcome === "completed")
      throw new AssignmentCommandError(
        "ASSIGNMENT_COMPLETED",
        "Rigger cannot be reassigned because the assignment has already been completed.",
      );
    if (result.outcome === "missing")
      throw new AssignmentCommandError("assignment-not-found", "Assignment was not found.");
    if (result.outcome === "changed")
      throw new AssignmentCommandError(
        "assignment_changed",
        "This Assignment was updated after you opened the dialog. Refresh and try again.",
      );
    if (result.outcome === "dependent-failed")
      throw new AssignmentCommandError(
        "dependent_update_failed",
        "The Assignment changed, but dependent records or audit could not be completed.",
      );
    if (result.outcome === "transaction-conflict")
      throw new AssignmentCommandError(
        "transaction_conflict",
        "The reassignment transaction did not commit. Refresh and try again.",
      );    await this.notifications?.deliver({type:"assignment_reassigned",category:"assignment",title:"Assignment reassigned",message:`Assignment ${assignmentId} was reassigned to ${r.name}.`,recipientUserKeys:[r.key],recipientEmails:[String(found.value.rigger_email??""),String(found.value.coordinator_email??"")],actorName:actor.name,targetType:"assignment",targetKey:assignmentKey,targetId:assignmentId,route:`/home/assignment/${encodeURIComponent(assignmentKey)}`,severity:"warning",operationId:`assignment-reassign:${assignmentKey}:${r.key}:${String(input.expected.rigger_email??"")}`});

    return {
      key: assignmentKey,
      assignmentId,
      riggerName: r.name,
      imageCount: result.imageCount ?? 0,
      cellCount: result.cellCount ?? 0,
    };
  }

  async transitionAssignment(
    id: string,
    action: AssignmentTransitionAction,
    actor: AssignmentRevisitActor,
  ) {
    const assignmentId = required(id, "Assignment ID");
    const found = await this.repo.findByAssignmentId(assignmentId);
    if (found.length !== 1)
      throw new AssignmentCommandError(
        found.length ? "stale-record" : "assignment-not-found",
        found.length ? "Assignment identity is ambiguous." : "Assignment was not found.",
      );
    if (!availableAssignmentTransitions(found[0].value).includes(action))
      throw new AssignmentCommandError(
        "ASSIGNMENT_INVALID_TRANSITION",
        "This Assignment can no longer perform the requested workflow action.",
      );
    const parts = jakartaParts(this.now());
    const outcome = await this.repo.transitionAssignment(
      found[0].key,
      action,
      {
        date: parts.date,
        datetime: parts.datetime,
      },
      actor,
    );
    if (outcome === "invalid-transition")
      throw new AssignmentCommandError(
        "ASSIGNMENT_INVALID_TRANSITION",
        "This Assignment changed before the workflow action was applied. Refresh and try again.",
      );
    if (outcome === "missing")
      throw new AssignmentCommandError(
        "stale-record",
        "Assignment changed before the workflow action was applied. Refresh and try again.",
      );
    const notificationType = action === "pause" ? "assignment_paused" : action === "resume" ? "assignment_resumed" : action === "complete" ? "assignment_completed" : null;
    if (notificationType) await this.notifications?.deliver({ type: notificationType, category: "assignment", title: action === "complete" ? "Assignment completed" : action === "pause" ? "Assignment paused" : "Assignment resumed", message: `Assignment ${assignmentId} was ${action === "complete" ? "completed" : action === "pause" ? "paused" : "resumed"}.`, recipientEmails: action === "complete" ? [String(found[0].value.coordinator_email ?? ""), String(found[0].value.rno_email ?? "")] : [String(found[0].value.rigger_email ?? ""), String(found[0].value.coordinator_email ?? "")], actorName: actor.name, targetType: "assignment", targetKey: found[0].key, targetId: assignmentId, route: `/home/assignment/${encodeURIComponent(found[0].key)}`, operationId: `assignment-transition:${found[0].key}:${action}:${parts.datetime}` });
    return { key: found[0].key, assignmentId, action };
  }
}
