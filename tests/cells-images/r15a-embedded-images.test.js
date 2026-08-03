import test from "node:test";
import assert from "node:assert/strict";
import {
  createImageId,
  extractEmbeddedImages,
  parseImageField,
  safeStorageContext,
} from "../../src/features/cells-images/embedded-image-contract.mjs";

test("extracts complete, incomplete, multiple and unknown image pairs without unrelated fields", () => {
  const rows = extractEmbeddedImages({
    sourceRecordType: "cell",
    sourceRecordKey: "-Oh4MZ_rjQK9qAqozN9Y",
    record: {
      assignment_id: "NPMXL_JAW_B_T",
      rcell_id: "sector_1_g900_NPMXL_JAW_B_T",
      sector: "9",
      band: "g900",
      foto_tower_height_name: "height.jpg",
      foto_tower_height_url: "https://firebasestorage.googleapis.com/v0/b/x/o/visit%2Fheight.jpg?alt=media&token=secret",
      foto_rru_type_sector_1_l850_url: "https://example.test/rru.jpg?token=secret",
      foto_custom_proof_name: "custom.jpg",
      profile_url: "https://example.test/not-an-image",
    },
  });
  assert.equal(rows.length, 3);
  assert.equal(rows[0].sourceRecordKey, "-Oh4MZ_rjQK9qAqozN9Y");
  assert.equal(rows.find((row) => row.fieldKey === "foto_tower_height")?.dataQuality, "complete");
  assert.equal(rows.find((row) => row.fieldKey === "foto_rru_type_sector_1_l850")?.dataQuality, "missing-name");
  assert.equal(rows.find((row) => row.fieldKey === "foto_custom_proof")?.dataQuality, "missing-url");
  assert.equal(rows.find((row) => row.fieldKey === "foto_custom_proof")?.categoryKnown, false);
  assert.equal(rows.find((row) => row.fieldKey.includes("sector_1"))?.sector, "9");
  assert.equal(rows.find((row) => row.fieldKey.includes("sector_1"))?.band, "g900");
});

test("parses confirmed category and sector-band patterns", () => {
  const cases = [
    ["foto_rigger_body_harness", "Rigger Body Harness", null, null],
    ["foto_wah_certificate_rigger", "WAH Certificate Rigger", null, null],
    ["foto_tower_height", "Tower Height", null, null],
    ["foto_rru_serial_number_sector_1_l850", "RRU Serial Number", "1", "l850"],
    ["foto_rru_type_sector_1_l850", "RRU Type", "1", "l850"],
  ];
  for (const [key, category, sector, band] of cases) {
    assert.deepEqual(parseImageField(key), { category, categoryKnown: true, sector, band });
  }
});

test("image IDs are deterministic, collision-resistant for identities, URL-safe and exclude tokens", () => {
  const id = createImageId("cell", "cell_key", "foto_tower_url");
  assert.equal(id, createImageId("cell", "cell_key", "foto_tower_url"));
  assert.notEqual(id, createImageId("cell", "another_key", "foto_tower_url"));
  assert.match(id, /^[A-Za-z0-9_-]{32}$/);
  assert.doesNotMatch(id, /token|https|secret/);
});

test("safe storage diagnostics remove query tokens", () => {
  const context = safeStorageContext("https://firebasestorage.googleapis.com/v0/b/x/o/visit%2Fphoto.jpg?alt=media&token=secret");
  assert.equal(context, "firebasestorage.googleapis.com/visit/photo.jpg");
  assert.doesNotMatch(context, /token|secret|alt=/);
});

test("duplicate RCell IDs remain distinct through database-key identity", () => {
  const record = { rcell_id: "duplicate", foto_tower_url: "https://example.test/a" };
  const first = extractEmbeddedImages({ sourceRecordType: "cell", sourceRecordKey: "key-a", record })[0];
  const second = extractEmbeddedImages({ sourceRecordType: "cell", sourceRecordKey: "key-b", record })[0];
  assert.equal(first.rcellId, second.rcellId);
  assert.notEqual(first.cellKey, second.cellKey);
  assert.notEqual(first.id, second.id);
});
