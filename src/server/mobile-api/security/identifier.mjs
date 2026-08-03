const FORBIDDEN = /[.#$[\]/\u0000-\u001f\u007f]/u;

export function validateMobileIdentifier(value, maximum = 180) {
  if (typeof value !== "string" || value.length === 0 || value.length > maximum) {
    return { valid: false, reason: "unsafe_identifier" };
  }
  if (value !== value.trim() || FORBIDDEN.test(value) || value.includes("..")) {
    return { valid: false, reason: "unsafe_identifier" };
  }
  return { valid: true, value };
}
