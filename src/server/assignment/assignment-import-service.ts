import type {
  AssignmentImportRow,
  AssignmentImportRowResult,
  AssignmentImportValidation,
} from "@/features/assignment/assignment-import-contract";
import {
  isTerminalAssignment,
  type AssignmentCreateInput,
} from "@/features/assignment/assignment-command-contract";
import type { RawAssignmentRecord } from "@/features/assignment/assignment-types";
import { AssignmentCommandError } from "./assignment-command-errors";
import type { AssignmentCommandRepository, ResolvedTower } from "./assignment-command-repository";
import { AssignmentCommandService, type PreparedAssignment } from "./assignment-command-service";

class RequestCachedRepository implements AssignmentCommandRepository {
  private towers = new Map<string, Promise<ResolvedTower | null>>();
  private users = new Map<string, ReturnType<AssignmentCommandRepository["findUser"]>>();
  private towerIds = new Map<
    string,
    ReturnType<AssignmentCommandRepository["findTowerByTowerId"]>
  >();
  private emails = new Map<string, ReturnType<AssignmentCommandRepository["findUserByEmail"]>>();
  private categories = new Map<string, ReturnType<AssignmentCommandRepository["findCategory"]>>();
  constructor(private delegate: AssignmentCommandRepository) {}
  findByKey(key: string) {
    return this.delegate.findByKey(key);
  }
  findTower(key: string) {
    if (!this.towers.has(key)) this.towers.set(key, this.delegate.findTower(key));
    return this.towers.get(key)!;
  }
  findTowerByTowerId(id: string) {
    const key = id.toUpperCase();
    if (!this.towerIds.has(key)) this.towerIds.set(key, this.delegate.findTowerByTowerId(key));
    return this.towerIds.get(key)!;
  }
  findUser(key: string) {
    if (!this.users.has(key)) this.users.set(key, this.delegate.findUser(key));
    return this.users.get(key)!;
  }
  findUserByEmail(email: string) {
    const key = email.toLowerCase();
    if (!this.emails.has(key)) this.emails.set(key, this.delegate.findUserByEmail(key));
    return this.emails.get(key)!;
  }
  findCategory(name: string) {
    if (!this.categories.has(name)) this.categories.set(name, this.delegate.findCategory(name));
    return this.categories.get(name)!;
  }
  findByAssignmentId(id: string) {
    return this.delegate.findByAssignmentId(id);
  }
  findByTowerId(id: string) {
    return this.delegate.findByTowerId(id);
  }
  reserveAssignmentKey() {
    return this.delegate.reserveAssignmentKey();
  }
  reserveRevisitKey(assignmentKey: string) {
    return this.delegate.reserveRevisitKey(assignmentKey);
  }
  createAssignment(key: string, record: RawAssignmentRecord) {
    return this.delegate.createAssignment(key, record);
  }
  createAssignments(records: Record<string, RawAssignmentRecord>) {
    return this.delegate.createAssignments(records);
  }
  revisitAssignment(
    key: string,
    eventKey: string,
    event: Parameters<AssignmentCommandRepository["revisitAssignment"]>[2],
  ) {
    return this.delegate.revisitAssignment(key, eventKey, event);
  }
  updateRiggerIfMutable(key: string, rigger: { name: string; email: string }) {
    return this.delegate.updateRiggerIfMutable(key, rigger);
  }
  reassignRiggerByKey(input: Parameters<AssignmentCommandRepository["reassignRiggerByKey"]>[0]) {
    return this.delegate.reassignRiggerByKey(input);
  }
  transitionAssignment(
    key: string,
    action: Parameters<AssignmentCommandRepository["transitionAssignment"]>[1],
    timestamp: Parameters<AssignmentCommandRepository["transitionAssignment"]>[2],
    actor: Parameters<AssignmentCommandRepository["transitionAssignment"]>[3],
  ) {
    return this.delegate.transitionAssignment(key, action, timestamp, actor);
  }
  updateChecklist(
    key: string,
    input: Parameters<AssignmentCommandRepository["updateChecklist"]>[1],
    actor: Parameters<AssignmentCommandRepository["updateChecklist"]>[2],
    timestamp: string,
  ) {
    return this.delegate.updateChecklist(key, input, actor, timestamp);
  }
  updateWorkReport(
    key: string,
    input: Parameters<AssignmentCommandRepository["updateWorkReport"]>[1],
    actor: Parameters<AssignmentCommandRepository["updateWorkReport"]>[2],
    timestamp: string,
  ) {
    return this.delegate.updateWorkReport(key, input, actor, timestamp);
  }
  listTowers(search: string, limit: number) {
    return this.delegate.listTowers(search, limit);
  }
  listUsers(search: string, kind: "rno" | "rigger" | "coordinator", limit: number) {
    return this.delegate.listUsers(search, kind, limit);
  }
  listCategories() {
    return this.delegate.listCategories();
  }
}

function normalized(row: AssignmentImportRow) {
  return {
    tower_id: row.tower_id.toUpperCase(),
    rno: row.rno.toLowerCase(),
    rigger: row.rigger.toLowerCase(),
    coordinator: row.coordinator.toLowerCase(),
    category: row.category,
    plan_date: row.plan_date || null,
    description: row.description || null,
  };
}
function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number),
    date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}
function errorField(code: string, message: string) {
  if (code.includes("tower")) return "tower_id";
  if (code.startsWith("rno")) return "rno";
  if (code.startsWith("rigger")) return "rigger";
  if (code.startsWith("coordinator")) return "coordinator";
  if (code.startsWith("category")) return "category";
  if (message.startsWith("plan_date")) return "plan_date";
  if (message.startsWith("description")) return "description";
  return "row";
}
export class AssignmentImportService {
  constructor(
    private repository: AssignmentCommandRepository,
    private now = () => new Date(),
  ) {}

  async validate(rows: AssignmentImportRow[]): Promise<AssignmentImportValidation> {
    const { validation } = await this.prepare(rows);
    return validation;
  }

  async commit(rows: AssignmentImportRow[]) {
    const { validation, prepared } = await this.prepare(rows);
    if (validation.invalidRows) return { ...validation, importedRows: 0 };
    const ids = new Set<string>(),
      keys = new Set<string>();
    for (const item of prepared) {
      if (ids.has(item.assignmentId) || keys.has(item.key))
        throw new AssignmentCommandError(
          "stale-record",
          "Generated Assignment identity collision. Retry the import.",
        );
      ids.add(item.assignmentId);
      keys.add(item.key);
    }
    for (const item of prepared) {
      const towerId = String(item.record.tower_id ?? "");
      if (
        (await this.repository.findByTowerId(towerId)).some(
          (entry) => !isTerminalAssignment(entry.value),
        )
      )
        throw new AssignmentCommandError(
          "stale-record",
          "Assignment data changed after validation. No Assignments were created.",
        );
    }
    const records = Object.fromEntries(prepared.map((item) => [item.key, item.record]));
    await this.repository.createAssignments(records);
    return {
      ...validation,
      importedRows: prepared.length,
      rows: validation.rows.map((row) => ({ ...row, status: "imported" as const })),
    };
  }

  private async prepare(rows: AssignmentImportRow[]) {
    const cached = new RequestCachedRepository(this.repository);
    const command = new AssignmentCommandService(cached, this.now);
    const results: AssignmentImportRowResult[] = [],
      prepared: PreparedAssignment[] = [];
    const duplicateTowers = new Set<string>(),
      duplicateRows = new Set<string>(),
      seenTowers = new Set<string>(),
      seenRows = new Set<string>();
    for (const row of rows) {
      const tower = row.tower_id.toUpperCase();
      const fingerprint = JSON.stringify([
        tower,
        row.rno.toLowerCase(),
        row.rigger.toLowerCase(),
        row.coordinator.toLowerCase(),
        row.category,
        row.plan_date,
        row.description,
      ]);
      if (seenTowers.has(tower)) duplicateTowers.add(tower);
      if (seenRows.has(fingerprint)) duplicateRows.add(fingerprint);
      seenTowers.add(tower);
      seenRows.add(fingerprint);
    }
    for (const row of rows) {
      const towerId = row.tower_id.toUpperCase();
      try {
        const fingerprint = JSON.stringify([
          towerId,
          row.rno.toLowerCase(),
          row.rigger.toLowerCase(),
          row.coordinator.toLowerCase(),
          row.category,
          row.plan_date,
          row.description,
        ]);
        if (duplicateRows.has(fingerprint))
          throw new AssignmentCommandError(
            "invalid-input",
            "Duplicate normalized row in uploaded file.",
          );
        if (duplicateTowers.has(towerId))
          throw new AssignmentCommandError(
            "invalid-input",
            "Duplicate tower row in uploaded file.",
          );
        for (const field of ["tower_id", "rno", "rigger", "coordinator", "category"] as const)
          if (!row[field])
            throw new AssignmentCommandError("invalid-input", `${field} is required.`);
        if (row.plan_date && !validDate(row.plan_date))
          throw new AssignmentCommandError("invalid-input", "plan_date must use YYYY-MM-DD.");
        if (row.description.length > 2000)
          throw new AssignmentCommandError("invalid-input", "description exceeds 2000 characters.");
        const [tower, rno, rigger, coordinator] = await Promise.all([
          cached.findTowerByTowerId(towerId),
          cached.findUserByEmail(row.rno),
          cached.findUserByEmail(row.rigger),
          cached.findUserByEmail(row.coordinator),
        ]);
        if (!tower) throw new AssignmentCommandError("tower-not-found", "Tower was not found.");
        if (!rno) throw new AssignmentCommandError("rno-not-found", "RNO was not found.");
        if (!rigger) throw new AssignmentCommandError("rigger-not-found", "Rigger was not found.");
        if (!coordinator)
          throw new AssignmentCommandError("coordinator-not-found", "Coordinator was not found.");
        const input: AssignmentCreateInput = {
          towerKey: tower.key,
          rnoKey: rno.key,
          riggerKey: rigger.key,
          coordinatorKey: coordinator.key,
          category: row.category,
          planDate: row.plan_date || undefined,
          description: row.description || undefined,
        };
        const item = await command.prepareCreateAssignment(input);
        prepared.push(item);
        results.push({
          rowNumber: row.rowNumber,
          towerId,
          status: "valid",
          normalized: normalized(row),
          errors: [],
          resolved: {
            tower: towerId,
            rno: rno.name,
            rigger: rigger.name,
            coordinator: coordinator.name,
            category: row.category,
          },
        });
      } catch (error) {
        const commandError = error instanceof AssignmentCommandError ? error : null;
        const message = commandError?.message ?? "Row could not be validated.",
          baseCode = commandError?.code ?? "invalid-input",
          code = message.startsWith("Duplicate normalized")
            ? "duplicate-row"
            : message.startsWith("Duplicate tower")
              ? "duplicate-tower"
              : message.includes("active Assignment")
                ? "active-assignment-conflict"
                : message.includes("required")
                  ? "missing-required-field"
                  : message.startsWith("plan_date")
                    ? "invalid-date"
                    : message.startsWith("description")
                      ? "field-too-long"
                      : baseCode;
        const field = errorField(code, message);
        results.push({
          rowNumber: row.rowNumber,
          towerId,
          status: "invalid",
          normalized: normalized(row),
          errors: [{ code, field, message }],
          code,
          field,
          message,
        });
      }
    }
    const invalidRows = results.filter((row) => row.status === "invalid").length;
    return {
      prepared: invalidRows ? [] : prepared,
      validation: {
        totalRows: rows.length,
        validRows: rows.length - invalidRows,
        invalidRows,
        warningRows: 0,
        canCommit: invalidRows === 0,
        rows: results,
      },
    };
  }
}
