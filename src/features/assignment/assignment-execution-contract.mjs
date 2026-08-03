export const ASSIGNMENT_CHECKLIST_STATUSES = Object.freeze(["pending", "completed", "not_applicable"]);
export const ASSIGNMENT_DEFAULT_CHECKLIST_ITEMS = Object.freeze([
  Object.freeze({ id: "site_access_confirmed", label: "Site access confirmed" }),
  Object.freeze({ id: "work_area_inspected", label: "Work area inspected" }),
  Object.freeze({ id: "safety_requirements_confirmed", label: "Safety requirements confirmed" }),
  Object.freeze({ id: "existing_condition_checked", label: "Existing condition checked" }),
  Object.freeze({ id: "required_work_completed", label: "Required work completed" }),
  Object.freeze({ id: "final_condition_verified", label: "Final condition verified" }),
  Object.freeze({ id: "site_cleaned", label: "Site cleaned" }),
  Object.freeze({ id: "result_documented", label: "Result documented" }),
]);
export const ASSIGNMENT_EXECUTION_LIMITS = Object.freeze({ maximumChecklistItems: 40, maximumLabelLength: 200, maximumItemNoteLength: 1000, maximumReportFieldLength: 5000, maximumMaterials: 30, maximumMaterialNameLength: 200, maximumMaterialUnitLength: 30, maximumMaterialNoteLength: 500, maximumQuantity: 1000000 });
const text = (value) => String(value ?? "").trim();
const defaultMap = new Map(ASSIGNMENT_DEFAULT_CHECKLIST_ITEMS.map((item) => [item.id, item.label]));
export function isAssignmentChecklistStatus(value) { return ASSIGNMENT_CHECKLIST_STATUSES.includes(value); }
export function canEditAssignmentExecution(record, actor) {
  const state = text(record?.assignment_state).toLowerCase(), status = text(record?.assignment_status).toLowerCase();
  const completed = status === "completed" || ["finished", "completed"].includes(state) || record?.completed === true || text(record?.completed).toLowerCase() === "true" || Boolean(text(record?.completed_datetime));
  const explicitlyActive = ["open", "accepted", "on progress", "paused"].includes(state) && status !== "completed" && !(record?.completed === true || text(record?.completed).toLowerCase() === "true");
  if (completed && !explicitlyActive) return false;
  const email = text(actor?.email).toLowerCase();
  return Boolean(email && (email === text(record?.rigger_email).toLowerCase() || email === text(record?.coordinator_email).toLowerCase())) || text(actor?.role).toLowerCase() === "super_admin";
}
export function normalizeAssignmentChecklist(value) {
  const source = value && typeof value === "object" ? value : {}, stored = source.items && typeof source.items === "object" ? source.items : {};
  const items = ASSIGNMENT_DEFAULT_CHECKLIST_ITEMS.map(({ id, label }) => { const item = stored[id] && typeof stored[id] === "object" ? stored[id] : {}; return { id, label, status: isAssignmentChecklistStatus(item.status) ? item.status : "pending", note: text(item.note), custom: false, updatedAt: text(item.updated_at) || null, updatedByName: text(item.updated_by_name) || null }; });
  for (const [id, item] of Object.entries(stored)) if (!defaultMap.has(id) && item && typeof item === "object" && text(item.label)) items.push({ id, label: text(item.label), status: isAssignmentChecklistStatus(item.status) ? item.status : "pending", note: text(item.note), custom: true, updatedAt: text(item.updated_at) || null, updatedByName: text(item.updated_by_name) || null });
  return { revision: Math.max(0, Number.parseInt(String(source.revision ?? 0), 10) || 0), updatedAt: text(source.updated_at) || null, updatedByName: text(source.updated_by_name) || null, items };
}
export function buildAssignmentChecklist(record, input, actor, timestamp) {
  const current = normalizeAssignmentChecklist(record?.work_checklist); if (current.revision !== input.expectedRevision) return null;
  const submitted = new Map(input.items.map((item) => [item.id, item])); const prior = new Map(current.items.map((item) => [item.id, item])); const next = {};
  for (const { id, label } of ASSIGNMENT_DEFAULT_CHECKLIST_ITEMS) { const item = submitted.get(id) ?? prior.get(id) ?? {}; next[id] = { label, status: isAssignmentChecklistStatus(item.status) ? item.status : "pending", note: text(item.note), custom: false, updated_at: timestamp, updated_by_uid: actor.uid, updated_by_name: actor.name }; }
  for (const item of input.items) if (!defaultMap.has(item.id)) next[item.id] = { label: text(item.label), status: item.status, note: text(item.note), custom: true, updated_at: timestamp, updated_by_uid: actor.uid, updated_by_name: actor.name };
  return { revision: current.revision + 1, initialized_at: text(record?.work_checklist?.initialized_at) || timestamp, initialized_by_uid: text(record?.work_checklist?.initialized_by_uid) || actor.uid, initialized_by_name: text(record?.work_checklist?.initialized_by_name) || actor.name, updated_at: timestamp, updated_by_uid: actor.uid, updated_by_name: actor.name, items: next };
}
export function normalizeAssignmentWorkReport(value) { const source = value && typeof value === "object" ? value : {}, materials = source.materials && typeof source.materials === "object" ? Object.entries(source.materials).map(([id,item]) => ({ id, name: text(item?.name), quantity: Number(item?.quantity ?? 0), unit: text(item?.unit), note: text(item?.note) })).filter((item) => item.name) : []; return { revision: Math.max(0, Number.parseInt(String(source.revision ?? 0),10)||0), findings: text(source.findings), actionsPerformed: text(source.actions_performed), technicalResult: text(source.technical_result), completionNotes: text(source.completion_notes), recommendations: text(source.recommendations), materials, updatedAt: text(source.updated_at)||null, updatedByName: text(source.updated_by_name)||null }; }
export function buildAssignmentWorkReport(record, input, actor, timestamp) { const current=normalizeAssignmentWorkReport(record?.work_report); if(current.revision!==input.expectedRevision)return null; return { revision: current.revision+1, findings:text(input.findings), actions_performed:text(input.actionsPerformed), technical_result:text(input.technicalResult), completion_notes:text(input.completionNotes), recommendations:text(input.recommendations), materials:Object.fromEntries(input.materials.map((item)=>[item.id,{name:text(item.name),quantity:item.quantity,unit:text(item.unit),note:text(item.note)}])), updated_at:timestamp, updated_by_uid:actor.uid, updated_by_name:actor.name }; }