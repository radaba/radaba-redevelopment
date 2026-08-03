const PHONE_PATTERN = /^[0-9+()\- .]{6,30}$/;

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const text = (value) => typeof value === "string" ? value.trim() : "";

export function normalizeProfileEditable(value = {}) {
  return { name: text(value.name), phone: text(value.phone) };
}

export function validateProfileUpdate(value) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const allowed = new Set(["name", "phone", "expected"]);
  const unauthorized = Object.keys(input).filter((key) => !allowed.has(key));
  if (unauthorized.length) return { success: false, code: "unauthorized_fields", message: "Only name and phone can be updated from Profile." };
  const expectedInput = input.expected;
  if (!expectedInput || typeof expectedInput !== "object" || Array.isArray(expectedInput)) return { success: false, code: "invalid_request", message: "Refresh your profile before saving." };
  if (Object.keys(expectedInput).some((key) => key !== "name" && key !== "phone")) return { success: false, code: "unauthorized_fields", message: "Only name and phone can be updated from Profile." };
  const name = text(input.name);
  const phone = text(input.phone);
  if (!own(input, "name") || !name) return { success: false, code: "invalid_name", message: "Full name is required." };
  if (name.length > 120) return { success: false, code: "invalid_name", message: "Full name must be 120 characters or fewer." };
  if (phone && !PHONE_PATTERN.test(phone)) return { success: false, code: "invalid_phone", message: "Enter a valid phone number." };
  return { success: true, value: { name, phone, expected: normalizeProfileEditable(expectedInput) } };
}

export function profileChangedFields(before, after) {
  return ["name", "phone"].filter((field) => before[field] !== after[field]);
}
