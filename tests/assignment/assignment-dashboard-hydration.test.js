import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("SVG titles render one interpolated string child", () => {
  const charts = source("src/components/assignment/assignment-dashboard-charts.tsx");
  assert.doesNotMatch(charts, /<title>\{item\.label\}: \{item\.value\}<\/title>/);
  assert.match(charts, /<title>\{`\$\{item\.label\}: \$\{item\.value\}`\}<\/title>/);
});

test("dashboard repeated labels use deterministic unique keys", () => {
  const charts = source("src/components/assignment/assignment-dashboard-charts.tsx");
  const dashboard = source("src/components/assignment/assignment-dashboard.tsx");
  assert.doesNotMatch(charts, /key=\{item\.label\}/);
  assert.doesNotMatch(dashboard, /<th key=\{label\}/);
  assert.match(charts, /key=\{`\$\{item\.label\}-\$\{index\}`\}/);
  assert.match(dashboard, /<th key=\{`\$\{label\}-\$\{index\}`\}/);
});

test("dashboard render components contain no client-server unstable primitives", () => {
  const rendering = [
    source("src/components/assignment/assignment-dashboard-charts.tsx"),
    source("src/components/assignment/assignment-dashboard.tsx"),
  ].join("\n");
  assert.doesNotMatch(rendering, /Date\.now|new Date\(|Math\.random|randomUUID|typeof window|toLocale/);
});
