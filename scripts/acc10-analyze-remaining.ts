/* eslint-disable @typescript-eslint/no-explicit-any */
// ACC-10: Analyze remaining failures after Phase 2a enrichment
import * as fs from "fs";
import * as path from "path";

const PROJECT_ROOT = path.resolve(import.meta.dir, "..");
const RESULTS_PATH = path.join(PROJECT_ROOT, "artifacts", "acc13-results.json");

const results = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf8"));
const all = results.scenario_results as any[];

const nonPass = all.filter((r) => r.classification !== "PASS");

// Categorize by extra rules and missing rules
const buckets: Record<string, { count: number; ids: string[]; classifications: Record<string, number> }> = {};
for (const r of nonPass) {
  const expSet = new Set(r.expected_rule_hits as string[]);
  const actSet = new Set(r.actual_rule_hits as string[]);
  const extras = [...actSet].filter((x) => !expSet.has(x)).sort().join("+") || "none";
  const missing = [...expSet].filter((x) => !actSet.has(x)).sort().join("+") || "none";
  const key = `extra:[${extras}] missing:[${missing}]`;
  if (!buckets[key]) buckets[key] = { count: 0, ids: [], classifications: {} };
  buckets[key].count++;
  buckets[key].ids.push(r.scenario_id);
  const cls = r.classification as string;
  buckets[key].classifications[cls] = (buckets[key].classifications[cls] || 0) + 1;
}

const sorted = Object.entries(buckets).sort((a, b) => b[1].count - a[1].count);

console.log("REMAINING FAILURE BUCKETS (after Phase 2a):");
console.log("=".repeat(120));
for (const [key, val] of sorted) {
  console.log();
  console.log(`${key} — ${val.count} scenarios`);
  console.log(`  Classifications: ${JSON.stringify(val.classifications)}`);
  console.log(`  IDs: ${val.ids.join(", ")}`);
}
console.log();
console.log(`Total non-PASS: ${nonPass.length}`);

// Show PASS scenarios
const passed = all.filter((r) => r.classification === "PASS");
console.log(`\nPASSED scenarios (${passed.length}):`);
console.log(passed.map((r: any) => r.scenario_id).join(", "));

// Show breakdown by classification
console.log("\n--- Classification breakdown ---");
const clsCounts: Record<string, number> = {};
for (const r of all) {
  clsCounts[r.classification] = (clsCounts[r.classification] || 0) + 1;
}
for (const [cls, count] of Object.entries(clsCounts).sort()) {
  console.log(`  ${cls}: ${count}`);
}
