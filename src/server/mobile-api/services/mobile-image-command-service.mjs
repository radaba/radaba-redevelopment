const BANDS = ["g900", "g1800", "u900", "u2100", "l900", "l1800", "l2100", "l850", "l2300"];
export const FULL_TOWER_SNAPSHOT_FIELDS = Object.freeze([
  "tower_type",
  "tower_height",
  "total_antenna",
  "total_rru",
  "single_sector",
  "multi_sector",
  "route_distance",
  "justifikasi",
]);
export const fullTowerSnapshotValues = (body) =>
  Object.fromEntries(
    FULL_TOWER_SNAPSHOT_FIELDS.filter(
      (field) =>
        Object.hasOwn(body ?? {}, field) &&
        body[field] !== undefined &&
        body[field] !== null &&
        !(typeof body[field] === "string" && !body[field].trim()),
    ).map((field) => [field, body[field]]),
  );
const active = (assignment) =>
  new Set(["open", "accepted", "on progress", "paused"]).has(
    String(assignment?.assignment_state ?? assignment?.assignment_status ?? "")
      .trim()
      .toLowerCase(),
  ) && assignment?.completed !== true;
export const createMobileImageCommandService = (repository) => ({
  async update(body) {
    const assignments = await repository.findAssignments(body.assignment_id),
      assignment = assignments[0];
    if (typeof body.tower_height !== "undefined") {
      for (const band of BANDS) {
        for (let sector = 1; sector <= assignment.value[band]; sector++) {
          const rcellId = `sector_${sector}_${band}_${assignment.value.assignment_id}`;
          await repository.upsertCell(rcellId, {
            tower_height: body.tower_height,
            rcell_id: rcellId,
          });
        }
      }
    }
    const synchronization = assignment
      ? {
          assignmentKey: assignment.key,
          synchronizeAssignment: active(assignment.value),
          snapshot: fullTowerSnapshotValues(body),
        }
      : undefined;
    await repository.upsertImage(body.assignment_id, body, synchronization);
    return body;
  },
});
