import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ASSIGNMENT_IMPORT_FILENAME,
  ASSIGNMENT_IMPORT_HEADINGS,
  ASSIGNMENT_IMPORT_SAMPLE_ROWS,
  ASSIGNMENT_IMPORT_MAX_BYTES,
  ASSIGNMENT_IMPORT_MAX_ROWS,
  AssignmentCsvError,
  assignmentImportErrorReport,
  assignmentImportTemplate,
  parseAssignmentCsv,
} from "../../src/features/assignment/assignment-import-contract.mjs";
const source = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");
const header = ASSIGNMENT_IMPORT_HEADINGS.join(",");
test("normalizes trimmed case-insensitive headers and rejects header-only files", () => {
  const mixed = " Tower_ID , RNO , RIGGER , COORDINATOR , CATEGORY , PLAN_DATE , DESCRIPTION ";
  assert.equal(parseAssignmentCsv(`${mixed}\nT,r,g,c,x,,`).length, 1);
  assert.throws(
    () => parseAssignmentCsv(header),
    (e) => e.code === "empty-file",
  );
});
test("error report uses the exact six-column contract", () => {
  const first = assignmentImportErrorReport([])
    .replace(/^\uFEFF/, "")
    .split("\r\n")[0];
  assert.equal(first, "row_number,tower_id,status,error_code,field,message");
});
test("template keeps exact order and adds five parseable sample rows", () => {
  const csv = assignmentImportTemplate();
  assert.equal(ASSIGNMENT_IMPORT_FILENAME, "radaba-assignment-import-template.csv");
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.equal(csv.replace(/^\uFEFF/, "").split("\r\n")[0], header);
  assert.equal(ASSIGNMENT_IMPORT_SAMPLE_ROWS.length, 5);
  const rows = parseAssignmentCsv(csv);
  assert.equal(rows.length, 5);
  assert.deepEqual(
    rows.map((row) => row.tower_id),
    ["TNG001", "TNG002", "TNG003", "TNG004", "TNG005"],
  );
  for (const row of rows) {
    assert.match(row.rno, /^[^@]+@[^@]+$/);
    assert.match(row.rigger, /^[^@]+@[^@]+$/);
    assert.match(row.coordinator, /^[^@]+@[^@]+$/);
    assert.match(row.plan_date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(row.description);
  }
});
test("parses valid CSV with LF, CRLF, BOM, quotes, whitespace, and blank rows", () => {
  for (const eol of ["\n", "\r\n"]) {
    const rows = parseAssignmentCsv(
      `\uFEFF${header}${eol} T1 ,r@example.test,g@example.test,c@example.test,Audit,2026-01-01,\" note, one \"${eol}${eol}`,
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].tower_id, "T1");
    assert.equal(rows[0].description, "note, one");
  }
});
test("rejects empty and malformed quoted files", () => {
  assert.throws(
    () => parseAssignmentCsv("  "),
    (e) => e instanceof AssignmentCsvError && e.code === "empty-file",
  );
  assert.throws(
    () => parseAssignmentCsv(`${header}\n\"bad`),
    (e) => e.code === "malformed-csv",
  );
});
test("rejects missing, unknown, duplicate, reordered, and extra columns", () => {
  assert.throws(() => parseAssignmentCsv("tower_id,rno"), /headings/i);
  assert.throws(
    () => parseAssignmentCsv(`${header},other`),
    (e) => e.code === "unknown-header",
  );
  assert.throws(
    () => parseAssignmentCsv("tower_id,tower_id,rigger,coordinator,category,plan_date,description"),
    (e) => e.code === "duplicate-header",
  );
  assert.throws(
    () => parseAssignmentCsv(`rno,tower_id,rigger,coordinator,category,plan_date,description`),
    /order/i,
  );
  assert.throws(
    () => parseAssignmentCsv(`${header}\nT,r,g,c,x,,,extra`),
    (e) => e.code === "extra-columns",
  );
});
test("enforces 200-row and 1 MiB published limits", () => {
  assert.equal(ASSIGNMENT_IMPORT_MAX_ROWS, 200);
  assert.equal(ASSIGNMENT_IMPORT_MAX_BYTES, 1048576);
  const line = "T,r,g,c,x,,",
    csv = [header, ...Array.from({ length: 201 }, () => line)].join("\n");
  assert.throws(
    () => parseAssignmentCsv(csv),
    (e) => e.code === "row-limit",
  );
});
test("error report is safe, bounded to correction fields, and formula protected", () => {
  const csv = assignmentImportErrorReport([
    {
      rowNumber: 2,
      towerId: "=cmd",
      status: "invalid",
      code: "invalid-input",
      message: "bad, value",
    },
  ]);
  assert.match(csv, /"bad, value"/);
  assert.match(csv, /'=cmd/);
  assert.doesNotMatch(csv, /email|firebase|push.?key/i);
});
test("template and import routes require Assignment session authorization", async () => {
  for (const path of [
    "src/app/api/assignments/import/template/route.ts",
    "src/app/api/assignments/import/validate/route.ts",
    "src/app/api/assignments/import/commit/route.ts",
  ])
    assert.match(await source(path), /resolveAssignmentActor/);
});
test("validation and commit re-read the uploaded file server-side", async () => {
  for (const path of [
    "src/app/api/assignments/import/validate/route.ts",
    "src/app/api/assignments/import/commit/route.ts",
  ])
    assert.ok((await source(path)).includes("readAssignmentImport(request)"));
});
test("commit is all-or-nothing and performs one named batch write", async () => {
  const service = await source("src/server/assignment/assignment-import-service.ts");
  assert.ok(
    service.indexOf("if(validation.invalidRows)") <
      service.lastIndexOf("createAssignments(records)"),
  );
  assert.equal(service.split("await this.repository.createAssignments(records)").length - 1, 1);
});
test("bulk preparation reuses the Phase 7D command service", async () => {
  const service = await source("src/server/assignment/assignment-import-service.ts"),
    command = await source("src/server/assignment/assignment-command-service.ts");
  assert.ok(service.includes("command.prepareCreateAssignment(input)"));
  assert.ok(command.includes("createAssignment(input"));
  assert.ok(command.includes("this.prepareCreateAssignment(input)"));
});
test("repository exposes no generic batch write and uses one root update", async () => {
  const contract = await source("src/server/assignment/assignment-command-repository.ts"),
    firebase = await source("src/server/assignment/firebase-assignment-command-repository.ts");
  assert.match(contract, /createAssignments/);
  assert.doesNotMatch(contract, /\b(set|push|remove|delete)\s*\(/);
  assert.ok(firebase.includes("this.db.ref().update(updates)"));
});
test("request-scoped caching and duplicate tower checks are present", async () => {
  const service = await source("src/server/assignment/assignment-import-service.ts");
  assert.match(service, /RequestCachedRepository/);
  assert.match(service, /duplicateTowers/);
  assert.match(service, /Duplicate tower row/);
});
test("UI supports select, preview, validation, confirmation, results, errors, and pending guard", async () => {
  const ui = await source("src/components/assignment/assignment-import-dialog.tsx");
  for (const text of [
    "Select",
    "Preview",
    "Validate",
    "Confirm",
    "Import",
    "Results",
    "Download error report",
  ])
    assert.ok(ui.includes(text));
  assert.match(ui, /if\s*\(!file\s*\|\|\s*busy\)\s*return/);
  assert.doesNotMatch(ui, /localStorage|indexedDB|firebase/i);
});
test("desktop and mobile result views plus focus-managed shell are used", async () => {
  const ui = await source("src/components/assignment/assignment-import-dialog.tsx");
  assert.match(ui, /sm:block/);
  assert.match(ui, /sm:hidden/);
  assert.match(ui, /AssignmentDialogShell/);
});
test("validation shape and commit-time safety checks are explicit", async () => {
  const service = await source("src/server/assignment/assignment-import-service.ts");
  const compact = service.replace(/\s+/g, "");
  for (const token of [
    "canCommit:invalidRows===0",
    "normalized:normalized(row)",
    "errors:[{code,field,message}]",
  ])
    assert.ok(compact.includes(token));
  for (const message of [
    "Generated Assignment identity collision",
    "Assignment data changed after validation",
  ])
    assert.ok(service.includes(message));
});
test("approved email identifiers and differentiated HTTP errors are enforced", async () => {
  const service = await source("src/server/assignment/assignment-import-service.ts"),
    file = await source("src/server/assignment/assignment-import-file.ts"),
    errors = await source("src/server/assignment/assignment-command-errors.ts");
  assert.match(service, /findUserByEmail/);
  assert.match(file, /import-file-too-large/);
  assert.match(errors, /413/);
  assert.match(errors, /422/);
});
