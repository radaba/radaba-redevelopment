const base = process.env.SMOKE_BASE_URL || process.env.APP_URL;
if (!base) throw new Error("SMOKE_BASE_URL or APP_URL is required");
const targets = [
  ["/api/health", 200],
  ["/live", 200],
  ["/ready", 200],
  ["/login", 200],
];
for (const [path, expected] of targets) {
  const response = await fetch(new URL(path, base), {
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status !== expected) {
    throw new Error(path + " returned " + response.status + ", expected " + expected);
  }
  console.log(path + " " + response.status);
}
