/* eslint-disable @typescript-eslint/no-explicit-any */
// ACC-14 Phase 4: Coverage gap analysis
import * as fs from "fs";
import * as path from "path";

const PROJECT_ROOT = path.resolve(import.meta.dir, "..");
const scenarios = fs.readFileSync(path.join(PROJECT_ROOT, "specs/ACC-02-scenarios.jsonl"), "utf8")
  .trim().split("\n").map((l) => JSON.parse(l));

console.log("=== ACC-14 Coverage Gap Analysis ===\n");

// Gap 1: Same-day E/M + procedure with -25 modifier
console.log("--- Gap 1: Same-day E/M + procedure with -25 modifier ---");
const emCodes = ["99201","99202","99203","99204","99205","99211","99212","99213","99214","99215"];
const gap1 = scenarios.filter((s: any) => {
  const cpts = s.structured_fields.cpt_codes_submitted;
  const mods = s.structured_fields.modifiers_present;
  const hasEM = cpts.some((c: string) => emCodes.includes(c));
  const hasProcedure = cpts.some((c: string) => !emCodes.includes(c));
  const has25 = Object.values(mods).some((m: any) => (m as string[]).includes("-25"));
  return hasEM && hasProcedure && has25;
});
console.log(`  Scenarios with E/M + procedure + -25: ${gap1.length}`);
for (const s of gap1) console.log(`    ${s.id}: ${s.clinical_vignette}`);

// Gap 1b: E/M + procedure WITHOUT -25 (should trigger R-3.4.2)
const gap1b = scenarios.filter((s: any) => {
  const cpts = s.structured_fields.cpt_codes_submitted;
  const mods = s.structured_fields.modifiers_present;
  const hasEM = cpts.some((c: string) => emCodes.includes(c));
  const hasProcedure = cpts.some((c: string) => !emCodes.includes(c));
  const has25 = Object.values(mods).some((m: any) => (m as string[]).includes("-25"));
  return hasEM && hasProcedure && !has25;
});
console.log(`  Scenarios with E/M + procedure WITHOUT -25: ${gap1b.length}`);
for (const s of gap1b.slice(0, 5)) console.log(`    ${s.id}: ${s.clinical_vignette}`);
if (gap1b.length > 5) console.log(`    ... and ${gap1b.length - 5} more`);

// Gap 2: Global period + unrelated procedure with -79
console.log("\n--- Gap 2: Global period + -79 modifier ---");
const gap2 = scenarios.filter((s: any) => {
  const mods = s.structured_fields.modifiers_present;
  const has79 = Object.values(mods).some((m: any) => (m as string[]).includes("-79"));
  return has79;
});
console.log(`  Scenarios with -79 modifier: ${gap2.length}`);
for (const s of gap2) console.log(`    ${s.id}: ${s.clinical_vignette}`);

// Also check for global period scenarios generally
const globalScenarios = scenarios.filter((s: any) => s.structured_fields.global_period_status !== "none");
console.log(`  Scenarios with active global period: ${globalScenarios.length}`);
for (const s of globalScenarios.slice(0, 5)) console.log(`    ${s.id}: ${s.clinical_vignette} (status: ${s.structured_fields.global_period_status})`);
if (globalScenarios.length > 5) console.log(`    ... and ${globalScenarios.length - 5} more`);

// Gap 3: Multi-line bilateral vs single-line 2-unit
console.log("\n--- Gap 3: Bilateral billing patterns ---");
const gap3_bilateral = scenarios.filter((s: any) => s.structured_fields.laterality === "bilateral");
console.log(`  Bilateral scenarios: ${gap3_bilateral.length}`);
for (const s of gap3_bilateral) {
  const units = s.structured_fields.units_of_service;
  const unitStr = Object.entries(units).map(([k,v]) => `${k}:${v}`).join(", ");
  console.log(`    ${s.id}: ${s.clinical_vignette} | units: ${unitStr}`);
}

// Gap 4: Add-on code without primary
console.log("\n--- Gap 4: Add-on codes ---");
const addOnCodes = ["20930","20931","22614","22840","22842","22845","27358","29999","15777","20936","20937","20938"];
const gap4 = scenarios.filter((s: any) => {
  return s.structured_fields.cpt_codes_submitted.some((c: string) => addOnCodes.includes(c));
});
console.log(`  Scenarios with add-on codes: ${gap4.length}`);
for (const s of gap4) console.log(`    ${s.id}: ${s.clinical_vignette}`);

// Gap 5: ICD-10 laterality
console.log("\n--- Gap 5: ICD-10 laterality mismatch ---");
const gap5 = scenarios.filter((s: any) => {
  return s.expected_rule_hits.includes("R-3.5.2");
});
console.log(`  Scenarios testing R-3.5.2 (ICD-10 laterality mismatch): ${gap5.length}`);
for (const s of gap5) console.log(`    ${s.id}: ${s.clinical_vignette}`);

// Also check for laterality info
const latScenarios = scenarios.filter((s: any) => {
  const icd = s.structured_fields.icd10_codes;
  const mods = s.structured_fields.modifiers_present;
  const hasLateralMod = Object.values(mods).some((m: any) => (m as string[]).some((mod: string) => ["-LT","-RT","-50"].includes(mod)));
  return hasLateralMod && icd.length > 0;
});
console.log(`  Scenarios with laterality modifier + ICD-10: ${latScenarios.length}`);

console.log("\n=== End Coverage Gap Analysis ===");
