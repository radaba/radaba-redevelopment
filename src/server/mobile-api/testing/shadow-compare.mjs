function bodyType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

export function compareMobileCompatibility(expected, actual) {
  const differences = [];
  if (expected.status !== actual.status) differences.push("status");
  if (bodyType(expected.body) !== bodyType(actual.body)) differences.push("body_type");
  if (JSON.stringify(expected.body) !== JSON.stringify(actual.body)) differences.push("body");
  return { equal: differences.length === 0, differences };
}
