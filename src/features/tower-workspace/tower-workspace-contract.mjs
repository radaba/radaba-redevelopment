import { extractEmbeddedImages } from "../cells-images/embedded-image-contract.mjs";

const text = (value) => String(value ?? "").trim();
const lower = (value) => text(value).toLowerCase();
const number = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const bandParts = (value) => {
  const match = lower(value).match(/^([gul])(\d+)$/);
  const family = { g: 0, u: 1, l: 2 }[match?.[1]] ?? 3;
  return [family, Number(match?.[2] ?? Number.MAX_SAFE_INTEGER), lower(value)];
};
export function compareBands(a, b) {
  const left = bandParts(a), right = bandParts(b);
  return left[0] - right[0] || left[1] - right[1] || left[2].localeCompare(right[2]);
}
export function compareSectors(a, b) {
  const left = number(a), right = number(b);
  if (left !== null && right !== null) return left - right;
  if (left !== null) return -1;
  if (right !== null) return 1;
  return text(a).localeCompare(text(b));
}
export function groupTowerCells(cells) {
  const groups = new Map();
  for (const cell of cells) {
    const sector = text(cell.sector) || "Unspecified";
    if (!groups.has(sector)) groups.set(sector, []);
    groups.get(sector).push(cell);
  }
  return [...groups].sort(([a], [b]) => compareSectors(a, b)).map(([sector, records]) => ({
    sector,
    cells: [...records].sort((a, b) =>
      compareBands(text(a.band) || "Unspecified", text(b.band) || "Unspecified") ||
      text(a.databaseKey).localeCompare(text(b.databaseKey))),
  }));
}
export function towerCoordinates(record) {
  const latitude = number(record.tower_latitude ?? record.latitude);
  const longitude = number(record.tower_longitude ?? record.longitude);
  if (latitude === null || longitude === null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}
const warning = (severity, code, message, recordType = "tower", recordKey = null) => ({ severity, code, message, recordType, recordKey });
const truthy = (value) => value === true || ["true", "yes", "1"].includes(lower(value));
function people(records) {
  const definitions = [["rigger","rigger_name","rigger_email"],["coordinator","coordinator_name","coordinator_email"],["rno","rno_name","rno_email"]];
  const result = [], warnings = [];
  for (const [role,nameField,emailField] of definitions) {
    const identities = new Map();
    records.forEach(({ source, record }) => {
      const name = text(record[nameField]), email = lower(record[emailField]);
      if (!name && !email) return;
      const key = email || `name:${lower(name)}`;
      const current = identities.get(key) ?? { role, name, email, sources: [] };
      if (name && current.name && lower(name) !== lower(current.name)) warnings.push(warning("warning", "conflicting-person", `Conflicting ${role} names use email ${email}.`));
      current.sources.push(source); identities.set(key, current);
    });
    result.push(...identities.values());
    if (identities.size > 1) warnings.push(warning("warning", "conflicting-person", `Multiple ${role} identities appear in the bounded workspace.`));
  }
  return { result, warnings };
}
function timeline(tower, assignment, cells, images) {
  const events = [];
  const add = (timestamp, label, source, actor = null, relatedKey = null) => {
    if (text(timestamp)) events.push({ timestamp: text(timestamp), label, source, actor: text(actor) || null, relatedKey });
  };
  if (assignment) {
    add(assignment.created_datetime ?? assignment.created_date, "Assignment created", "assignment", assignment.coordinator_name, assignment.key);
    add(assignment.accepted_datetime ?? assignment.accepted_date, "Assignment accepted", "assignment", assignment.rigger_name, assignment.key);
    add(assignment.completed_datetime ?? assignment.closed_datetime, "Assignment completed", "assignment", assignment.rigger_name, assignment.key);
  }
  add(tower.submitted_at ?? tower.created_datetime, "Tower visit submitted", "tower", tower.rigger_name, tower.databaseKey);
  add(tower.updated_at ?? tower.updated_datetime, "Tower visit updated", "tower", tower.rigger_name, tower.databaseKey);
  cells.forEach((cell) => {
    add(cell.submitted_at ?? cell.created_datetime, "Cell submitted", "cell", cell.rigger_name, cell.databaseKey);
    add(cell.updated_at ?? cell.updated_datetime, "Cell updated", "cell", cell.rigger_name, cell.databaseKey);
    add(cell.closed_datetime ?? cell.closed_date, "Cell closed", "cell", cell.rigger_name, cell.databaseKey);
  });
  images.forEach((image) => add(image.submittedAt, "Image metadata submitted", image.sourceRecordType, image.riggerName, image.id));
  return events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
export function buildTowerWorkspace({ tower, assignments = [], cells = [] }) {
  const assignment = assignments[0] ?? null;
  const towerImages = extractEmbeddedImages({ sourceRecordType: "tower", sourceRecordKey: tower.databaseKey, record: tower });
  const cellImages = cells.flatMap((cell) => extractEmbeddedImages({ sourceRecordType: "cell", sourceRecordKey: cell.databaseKey, record: cell }));
  const groupedSectors = groupTowerCells(cells);
  const warnings = [];
  if (!text(tower.tower_id)) warnings.push(warning("error","missing-tower-id","Tower ID is missing."));
  if (!text(tower.sitename)) warnings.push(warning("warning","missing-site","Site name is missing."));
  if (!towerCoordinates(tower)) warnings.push(warning("warning","invalid-coordinates","Coordinates are missing, malformed, or outside valid ranges."));
  if (!text(tower.rigger_name) && !cells.some((cell) => text(cell.rigger_name)) && !assignment?.rigger_name) warnings.push(warning("warning","missing-rigger","Rigger identity is missing."));
  if (!assignment) warnings.push(warning("warning","missing-assignment","No bounded Assignment relation was resolved."));
  if (truthy(tower.single_sector) && truthy(tower.multi_sector)) warnings.push(warning("warning","sector-mode-contradiction","single_sector and multi_sector are both enabled."));
  const sectorBands = new Map(), rcellIds = new Map();
  cells.forEach((cell) => {
    const key = cell.databaseKey;
    if (!text(cell.rcell_id)) warnings.push(warning("warning","missing-rcell-id","Cell RCell ID is missing.","cell",key));
    if (!text(cell.sector)) warnings.push(warning("warning","missing-sector","Cell sector is missing.","cell",key));
    if (!text(cell.band)) warnings.push(warning("warning","missing-band","Cell band is missing.","cell",key));
    if (!text(cell.rru_type) && !text(cell.rru_serial_number)) warnings.push(warning("info","missing-rru","Cell RRU information is missing.","cell",key));
    if (!text(cell.antenna_type) && !text(cell.antenna_serial_number)) warnings.push(warning("info","missing-antenna","Cell antenna information is missing.","cell",key));
    if (!text(cell.closed_datetime) && !text(cell.closed_date)) warnings.push(warning("info","open-cell","Cell has no closed timestamp.","cell",key));
    const pair = `${lower(cell.sector) || "?"}\0${lower(cell.band) || "?"}`;
    sectorBands.set(pair, [...(sectorBands.get(pair) ?? []), key]);
    const rcell = lower(cell.rcell_id);
    if (rcell) rcellIds.set(rcell, [...(rcellIds.get(rcell) ?? []), key]);
  });
  for (const keys of sectorBands.values()) if (keys.length > 1) warnings.push(warning("warning","duplicate-sector-band",`${keys.length} Cell records share a sector-band pair.`,"cell",keys[0]));
  for (const keys of rcellIds.values()) if (keys.length > 1) warnings.push(warning("warning","duplicate-rcell-id",`${keys.length} Cell records share an RCell ID.`,"cell",keys[0]));
  [...towerImages,...cellImages].forEach((image) => {
    if (image.dataQuality !== "complete") warnings.push(warning("warning",image.dataQuality,`${image.category} has an incomplete name/URL pair.`,"image",image.id));
    if (!image.categoryKnown) warnings.push(warning("info","unclassified-image",`${image.fieldKey} uses an unclassified category.`,"image",image.id));
  });
  const personData = people([{source:"tower",record:tower},...assignments.map((record)=>({source:"assignment",record})),...cells.map((record)=>({source:`cell:${record.databaseKey}`,record}))]);
  warnings.push(...personData.warnings);
  return { tower, assignment, assignments, cells, groupedSectors, towerImages, cellImages, people: personData.result, timeline: timeline(tower, assignment, cells, [...towerImages,...cellImages]), warnings };
}
