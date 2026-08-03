import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeProfileEditable,
  profileChangedFields,
  validateProfileUpdate,
} from "../../src/features/profile/profile-contract.mjs";

test("profile validation trims approved values and preserves phone as a string", () => {
  assert.deepEqual(
    validateProfileUpdate({
      name: "  Example User  ",
      phone: " 0812-3456-7890 ",
      expected: { name: "Old", phone: "0812" },
    }),
    {
      success: true,
      value: {
        name: "Example User",
        phone: "0812-3456-7890",
        expected: { name: "Old", phone: "0812" },
      },
    },
  );
});
test("blank optional phone is supported while name is required", () => {
  assert.equal(
    validateProfileUpdate({ name: "Name", phone: "", expected: { name: "Name", phone: "" } })
      .success,
    true,
  );
  assert.deepEqual(
    validateProfileUpdate({ name: "   ", phone: "", expected: { name: "Name", phone: "" } }),
    { success: false, code: "invalid_name", message: "Full name is required." },
  );
});
test("invalid phones and unauthorized administrator fields are rejected", () => {
  assert.equal(
    validateProfileUpdate({ name: "Name", phone: "letters", expected: { name: "Name", phone: "" } })
      .success,
    false,
  );
  for (const field of ["uid", "email", "role", "privileges", "status", "company"]) {
    const result = validateProfileUpdate({
      name: "Name",
      phone: "",
      expected: { name: "Name", phone: "" },
      [field]: "attempt",
    });
    assert.equal(result.success, false);
    assert.equal(result.code, "unauthorized_fields");
  }
});
test("expected concurrency snapshot cannot include client identity fields", () => {
  const result = validateProfileUpdate({
    name: "Name",
    phone: "",
    expected: { name: "Name", phone: "", userKey: "another-user" },
  });
  assert.equal(result.success, false);
  assert.equal(result.code, "unauthorized_fields");
});
test("normalization handles existing records without phone and change detection is exact", () => {
  assert.deepEqual(normalizeProfileEditable({ name: " Existing ", role: "Rigger" }), {
    name: "Existing",
    phone: "",
  });
  assert.deepEqual(profileChangedFields({ name: "A", phone: "0" }, { name: "B", phone: "0" }), [
    "name",
  ]);
});
