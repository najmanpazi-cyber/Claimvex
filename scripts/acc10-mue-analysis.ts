/* eslint-disable @typescript-eslint/no-explicit-any */
// ACC-10: MUE at-limit-1 firing analysis
import * as fs from "fs";
import * as path from "path";

const PROJECT_ROOT = path.resolve(import.meta.dir, "..");
const mue = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, "src/data/mue/mue.orthopedics.q1-2026.json"), "utf8"));
const scenarios = fs.readFileSync(path.join(PROJECT_ROOT, "specs/ACC-02-scenarios.jsonl"), "utf8")
  .trim().split("\n").map((l: string) => JSON.parse(l));

const mueMap = new Map<string, number>(mue.map((e: any) => [e.cpt_code, e.mue_value]));

let atLimit1Count = 0;
let atLimitGt1Count = 0;
let scenariosWithAtLimit1 = 0;
let scenariosWithAtLimitGt1 = 0;
const codeFreq: Record<string, number> = {};

for (const s of scenarios) {
  const units = s.structured_fields.units_of_service as Record<string, number>;
  let hasAtLimit1 = false;
  let hasAtLimitGt1 = false;

  for (const [code, u] of Object.entries(units)) {
    const mueVal = mueMap.get(code);
    if (mueVal !== undefined && u === mueVal) {
      if (mueVal === 1) {
        atLimit1Count++;
        hasAtLimit1 = true;
        codeFreq[code] = (codeFreq[code] || 0) + 1;
      } else {
        atLimitGt1Count++;
        hasAtLimitGt1 = true;
      }
    }
  }

  if (hasAtLimit1) scenariosWithAtLimit1++;
  if (hasAtLimitGt1) scenariosWithAtLimitGt1++;
}

console.log("=== MUE At-Limit-1 Firing Analysis ===\n");
console.log(`MUE data: ${mue.filter((e: any) => e.mue_value === 1).length} codes with MUE=1, ${mue.filter((e: any) => e.mue_value > 1).length} codes with MUE>1 (total: ${mue.length})`);
console.log(`\nAt-limit-1 code firings (units=1, MUE=1): ${atLimit1Count}`);
console.log(`At-limit-gt-1 code firings (units=MUE, MUE>1): ${atLimitGt1Count}`);
console.log(`\nScenarios with at-limit-1 firing: ${scenariosWithAtLimit1} / ${scenarios.length} (${(scenariosWithAtLimit1/scenarios.length*100).toFixed(1)}%)`);
console.log(`Scenarios with at-limit-gt-1 firing: ${scenariosWithAtLimitGt1} / ${scenarios.length}`);

console.log("\nCode frequency of at-limit-1 firings:");
const sorted = Object.entries(codeFreq).sort((a, b) => (b[1] as number) - (a[1] as number));
for (const [code, count] of sorted) {
  const entry = mue.find((e: any) => e.cpt_code === code);
  console.log(`  ${code}: ${count} scenarios (MUE=${entry.mue_value}, ${entry.adjudication_note.substring(0, 50)})`);
}

// Count how many "pass"-expected scenarios are affected
const passExpected = scenarios.filter((s: any) => s.expected_action === "pass");
const passWithAtLimit1 = passExpected.filter((s: any) => {
  const units = s.structured_fields.units_of_service as Record<string, number>;
  for (const [code, u] of Object.entries(units)) {
    const mueVal = mueMap.get(code);
    if (mueVal === 1 && u === 1) return true;
  }
  return false;
});
console.log(`\nExpected-pass scenarios affected by at-limit-1: ${passWithAtLimit1.length} / ${passExpected.length}`);
console.log(`IDs: ${passWithAtLimit1.map((s: any) => s.id).join(", ")}`);
